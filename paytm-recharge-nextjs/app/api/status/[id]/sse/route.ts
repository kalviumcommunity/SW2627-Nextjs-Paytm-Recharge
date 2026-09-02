import { NextRequest } from "next/server";
import {
  subscribeToSingleTransactionUpdate,
  TransactionStatusUpdatePayload,
} from "@/lib/events.server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: transactionId } = await params;
  const encoder = new TextEncoder();

  let cleanupSubscription: (() => void) | null = null;
  let heartbeatInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Fetch current transaction status from database
        const tx = await prisma.rechargeTransaction.findUnique({
          where: { transactionId },
          include: { operator: true },
        });

        if (!tx) {
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({
                error: "Transaction not found",
              })}\n\n`,
            ),
          );
          controller.close();
          return;
        }

        const initialPayload: TransactionStatusUpdatePayload = {
          transactionId: tx.transactionId,
          status: tx.status as "PENDING" | "SUCCESS" | "FAILED",
          updatedAt: tx.updatedAt.toISOString(),
          mobileNumber: tx.mobileNumber,
          amount: Number(tx.amount),
          operatorName: tx.operator.name,
        };

        controller.enqueue(
          encoder.encode(
            `event: status_update\ndata: ${JSON.stringify(
              initialPayload,
            )}\n\n`,
          ),
        );

        // If transaction has already reached a final state, close stream
        if (tx.status !== "PENDING") {
          controller.close();
          return;
        }

        // Subscribe to real-time status update for this specific transaction
        cleanupSubscription = subscribeToSingleTransactionUpdate(
          transactionId,
          (payload) => {
            try {
              controller.enqueue(
                encoder.encode(
                  `event: status_update\ndata: ${JSON.stringify(
                    payload,
                  )}\n\n`,
                ),
              );

              if (payload.status !== "PENDING") {
                // Final state reached; close cleanly
                if (cleanupSubscription) {
                  cleanupSubscription();
                  cleanupSubscription = null;
                }
                if (heartbeatInterval) {
                  clearInterval(heartbeatInterval);
                  heartbeatInterval = null;
                }
                controller.close();
              }
            } catch (err) {
              console.error("Failed to push single transaction SSE event:", err);
            }
          },
        );

        // Keep-alive heartbeat
        heartbeatInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch {
            if (heartbeatInterval) clearInterval(heartbeatInterval);
          }
        }, 15000);
      } catch (error) {
        console.error("Error in single transaction SSE:", error);
        controller.error(error);
      }
    },
    cancel() {
      if (cleanupSubscription) {
        cleanupSubscription();
        cleanupSubscription = null;
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
    },
  });

  request.signal.addEventListener("abort", () => {
    if (cleanupSubscription) {
      cleanupSubscription();
      cleanupSubscription = null;
    }
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
