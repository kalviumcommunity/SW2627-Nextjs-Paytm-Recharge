import { prisma } from "@/lib/prisma";
import { processMockRecharge } from "@/services/mock-recharge-provider.server";
import { DEVELOPMENT_USER_ID, DUPLICATE_WINDOW_SECONDS } from "@/lib/constants";
import type { RechargeRequest } from "@/types/recharge";

export async function createRechargeTransaction(
  data: RechargeRequest,
) {
  const operator = await prisma.operator.findUnique({
    where: {
      id: data.operatorId,
    },
  });

  if (!operator) {
    throw new Error("Operator not found");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: DEVELOPMENT_USER_ID,
    },
  });

  if (!user) {
    throw new Error("Development user not found");
  }

  const duplicateSince = new Date(
    Date.now() - DUPLICATE_WINDOW_SECONDS * 1000,
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
}