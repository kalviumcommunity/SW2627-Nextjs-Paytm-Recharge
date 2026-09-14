import { prisma } from "@/lib/prisma";
import { DEVELOPMENT_USER_ID } from "@/lib/constants";

export async function getTransactionHistory() {
  return prisma.rechargeTransaction.findMany({
    where: {
      userId: DEVELOPMENT_USER_ID,
    },
    select: {
      id: true,
      transactionId: true,
      mobileNumber: true,
      amount: true,
      status: true,
      createdAt: true,
      operator: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });
}
