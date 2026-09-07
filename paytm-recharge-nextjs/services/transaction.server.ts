import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultUser } from "@/services/recharge.server";

export async function getTransactionHistory() {
  const user = await getOrCreateDefaultUser();

  return prisma.rechargeTransaction.findMany({
    where: {
      userId: user.id,
    },
    include: {
      operator: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}