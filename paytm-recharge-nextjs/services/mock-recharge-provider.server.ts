import { prisma } from "@/lib/prisma";
import { publishTransactionUpdate } from "@/lib/events.server";

const MOCK_PROCESSING_DELAY_MS = 5000;

export async function processMockRecharge(transactionId: string) {
  await new Promise((resolve) =>
    setTimeout(resolve, MOCK_PROCESSING_DELAY_MS),
  );

  const status = Math.random() < 0.8 ? "SUCCESS" : "FAILED";

  const updatedTransaction = await prisma.rechargeTransaction.update({
    where: {
      transactionId,
    },
    data: {
      status,
    },
    include: {
      operator: true,
    },
  });

  // Notify active real-time listeners (SSE / WebSockets)
  publishTransactionUpdate({
    transactionId: updatedTransaction.transactionId,
    status: updatedTransaction.status as "PENDING" | "SUCCESS" | "FAILED",
    updatedAt: updatedTransaction.updatedAt.toISOString(),
    mobileNumber: updatedTransaction.mobileNumber,
    amount: Number(updatedTransaction.amount),
    operatorName: updatedTransaction.operator.name,
  });

  return status;
}