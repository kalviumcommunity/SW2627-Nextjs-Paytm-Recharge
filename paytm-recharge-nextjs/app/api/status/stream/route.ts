import { NextRequest } from "next/server";
import {
  subscribeToTransactionUpdates,
  TransactionStatusUpdatePayload,
} from "@/lib/events.server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const idsParam = searchParams.get("ids");
  const targetIds = idsParam
    ? new Set(idsParam.split(",").map((s) => s.trim()).filter(Boolean))
    : null;

  const encoder = new TextEncoder();
  let cleanupSubscription: (() => void) | null = null;
  let heartbeatInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      // 1. Send initial connected event
      controller.enqueue(
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({
            status: "connected",
            timestamp: new Date().toISOString(),
          })}\n\n`,
        ),
      );

      // 2. If specific IDs are requested, send their current statuses immediately
      if (targetIds && targetIds.size > 0) {
        try {
          const currentTransactions = await prisma.rechargeTransaction.findMany({
            where: {
              transactionId: {
                in: Array.from(targetIds),
              },
            },
            include: {
              operator: true,
            },
          });

          for (const tx of currentTransactions) {
            const payload: TransactionStatusUpdatePayload = {
              transactionId: tx.transactionId,
              status: tx.status as "PENDING" | "SUCCESS" | "FAILED",
              updatedAt: tx.updatedAt.toISOString(),
              mobileNumber: tx.mobileNumber,
              amount: Number(tx.amount),
              operatorName: tx.operator.name,
            };

            controller.enqueue(
              encoder.encode(
                `event: status_update\ndata: ${JSON.stringify(payload)}\n\n`,
              ),
            );
          }
        } catch (err) {
          console.error("Error fetching initial status for SSE stream:", err);
        }
      }

      // 3. Listen to real-time events from EventEmitter
      cleanupSubscription = subscribeToTransactionUpdates((payload) => {
        // Filter by target IDs if specified, otherwise forward all updates
        if (!targetIds || targetIds.has(payload.transactionId)) {
          try {
            controller.enqueue(
              encoder.encode(
                `event: status_update\ndata: ${JSON.stringify(payload)}\n\n`,
              ),
            );
          } catch (error) {
            console.error("Failed to enqueue SSE payload:", error);
          }
        }
      });

      // 4. Send keepalive comment every 15 seconds
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
        }
      }, 15000);
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

  // Handle client disconnection via AbortSignal
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
