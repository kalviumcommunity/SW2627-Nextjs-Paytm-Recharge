import { prisma } from "@/lib/prisma";

const DEVELOPMENT_USER_ID = 1;

interface CreateRechargeData {
  mobileNumber: string;
  operatorId: number;
  amount: number;
}

export async function createRechargeTransaction(
  data: CreateRechargeData,
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

  const transaction = await prisma.rechargeTransaction.create({
    data: {
      userId: user.id,
      operatorId: operator.id,
      mobileNumber: data.mobileNumber,
      amount: data.amount,
      status: "PENDING",
    },
  });

  return transaction;
}