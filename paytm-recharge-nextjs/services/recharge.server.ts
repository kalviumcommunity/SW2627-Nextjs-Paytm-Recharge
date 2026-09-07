import { prisma } from "@/lib/prisma";
import { processMockRecharge } from "@/services/mock-recharge-provider.server";

const DUPLICATE_WINDOW_SECONDS = 10;

// In-memory locks to prevent concurrent duplicate race conditions within milliseconds
const inFlightRechargeLocks = new Map<string, number>();

// In-memory operator cache to avoid redundant database roundtrips
const operatorCache = new Map<number, { id: number; name: string }>();

export async function getOrCreateDefaultUser() {
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: "dev@paytm-recharge.local" },
        { id: 1 },
      ],
    },
  });

  if (!user) {
    user = await prisma.user.findFirst();
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Development User",
        email: "dev@paytm-recharge.local",
        phone: "9999999999",
      },
    });
  }

  return user;
}

export async function getCachedOperator(operatorId: number) {
  if (operatorCache.has(operatorId)) {
    return operatorCache.get(operatorId)!;
  }
  const operator = await prisma.operator.findUnique({
    where: { id: operatorId },
  });
  if (operator) {
    operatorCache.set(operator.id, { id: operator.id, name: operator.name });
  }
  return operator;
}

interface CreateRechargeData {
  mobileNumber: string;
  operatorId: number;
  amount: number;
}

export async function createRechargeTransaction(
  data: CreateRechargeData,
) {
  const operator = await getCachedOperator(data.operatorId);

  if (!operator) {
    throw new Error("Operator not found");
  }

  const user = await getOrCreateDefaultUser();

  const lockKey = `${user.id}:${data.mobileNumber}:${operator.id}:${data.amount}`;
  const now = Date.now();

  // Prune expired locks if map grows large
  if (inFlightRechargeLocks.size > 200) {
    const cutoff = now - DUPLICATE_WINDOW_SECONDS * 1000;
    for (const [key, timestamp] of inFlightRechargeLocks.entries()) {
      if (timestamp < cutoff) {
        inFlightRechargeLocks.delete(key);
      }
    }
  }

  const lastAttempt = inFlightRechargeLocks.get(lockKey);
  if (lastAttempt && now - lastAttempt < DUPLICATE_WINDOW_SECONDS * 1000) {
    throw new Error("Duplicate recharge");
  }

  // Atomically claim lock for the duration of processing
  inFlightRechargeLocks.set(lockKey, now);

  try {
    const duplicateSince = new Date(
      now - DUPLICATE_WINDOW_SECONDS * 1000,
    );

    const duplicateTransaction =
      await prisma.rechargeTransaction.findFirst({
        where: {
          userId: user.id,
          mobileNumber: data.mobileNumber,
          operatorId: operator.id,
          amount: data.amount,
          createdAt: {
            gte: duplicateSince,
          },
        },
      });

    if (duplicateTransaction) {
      throw new Error("Duplicate recharge");
    }

    const transaction = await prisma.rechargeTransaction.create({
      data: {
        userId: user.id,
        operatorId: operator.id,
        mobileNumber: data.mobileNumber,
        amount: data.amount,
        status: "PENDING",
      },
    });

    void processMockRecharge(transaction.transactionId);

    return transaction;
  } catch (err) {
    // If failure was anything OTHER than a duplicate, release lock immediately so user can retry
    if (!(err instanceof Error && err.message === "Duplicate recharge")) {
      inFlightRechargeLocks.delete(lockKey);
    }
    throw err;
  }
}