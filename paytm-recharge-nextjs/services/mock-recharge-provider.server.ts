import { prisma } from "@/lib/prisma";

const MOCK_PROCESSING_DELAY_MS = 5000;

export async function processMockRecharge(transactionId: string) {
    
  await new Promise((resolve) =>
    setTimeout(resolve, MOCK_PROCESSING_DELAY_MS),
  );

  const status = Math.random() < 0.8 ? "SUCCESS" : "FAILED";

  await prisma.rechargeTransaction.update({
    where: {
      transactionId,
    },
    data: {
      status,
    },
  });

  return status;
}