import { prisma } from "@/lib/prisma";

export async function getRechargeStatus(transactionId: string) {
  const transaction = await prisma.rechargeTransaction.findUnique({
    where: {
      transactionId,
    },
    select: {
      transactionId: true,
      status: true,
      updatedAt: true,
    },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return transaction;
}

export async function getBatchRechargeStatus(transactionIds: string[]) {
  if (!transactionIds.length) {
    return [];
  }

  const transactions = await prisma.rechargeTransaction.findMany({
    where: {
      transactionId: {
        in: transactionIds,
      },
    },
    select: {
      transactionId: true,
      status: true,
      updatedAt: true,
    },
  });

  return transactions;
}