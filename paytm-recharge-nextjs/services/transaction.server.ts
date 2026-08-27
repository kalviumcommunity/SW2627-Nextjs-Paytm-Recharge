import { prisma } from "@/lib/prisma";

const DEVELOPMENT_USER_ID = 1;

export async function getTransactionHistory() {
  return prisma.rechargeTransaction.findMany({
    where: {
      userId: DEVELOPMENT_USER_ID,
    },
    include: {
      operator: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}