"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Transaction } from "@/types/transaction";
import { useOptimizedPolling } from "./useOptimizedPolling";

export type ConnectionMode = "live" | "polling" | "connecting" | "idle";

export interface RealtimeTransactionsOptions {
  enableSSE?: boolean;
  enablePollingFallback?: boolean;
  onStatusChange?: (updated: {
    transactionId: string;
    status: "PENDING" | "SUCCESS" | "FAILED";
  }) => void;
}

export function useRealtimeTransactions(
  transactions: Transaction[],
  options: RealtimeTransactionsOptions = {},
) {
  const {
    enableSSE = true,
    enablePollingFallback = true,
    onStatusChange,
  } = options;

  const queryClient = useQueryClient();
  const pendingTransactions = transactions.filter((t) => t.status === "PENDING");
  const pendingCount = pendingTransactions.length;

  const [streamState, setStreamState] = useState<"idle" | "connecting" | "live" | "polling">("idle");
  const eventSourceRef = useRef<EventSource | null>(null);

  const pendingIds = pendingTransactions.map((t) => t.transactionId);
  const pendingIdsString = pendingIds.sort().join(",");

  const applyStatusUpdate = useCallback(
    (update: { transactionId: string; status: "PENDING" | "SUCCESS" | "FAILED" }) => {
      queryClient.setQueryData<Transaction[]>(["transactions"], (old) => {
        if (!old) return old;
        return old.map((t) =>
          t.transactionId === update.transactionId
            ? { ...t, status: update.status }
            : t,
        );
      });

      onStatusChange?.(update);
    },
    [queryClient, onStatusChange],
  );

  // Derived connection status
  const connectionStatus: ConnectionMode =
    pendingCount === 0
      ? "idle"
      : !enableSSE || streamState === "polling"
      ? "polling"
      : streamState === "live"
      ? "live"
      : "connecting";

  // Use optimized polling fallback when in polling mode
  const isPollingEnabled =
    pendingCount > 0 &&
    (!enableSSE || streamState === "polling");

  useOptimizedPolling(pendingTransactions, {
    enabled: isPollingEnabled && enablePollingFallback,
    onStatusChange: applyStatusUpdate,
  });

  useEffect(() => {
    if (pendingCount === 0 || !enableSSE) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const streamUrl = `/api/status/stream?ids=${encodeURIComponent(pendingIdsString)}`;
    const eventSource = new EventSource(streamUrl);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("connected", () => {
      setStreamState("live");
    });

    eventSource.addEventListener("status_update", (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload && payload.transactionId && payload.status) {
          applyStatusUpdate({
            transactionId: payload.transactionId,
            status: payload.status,
          });
        }
      } catch (err) {
        console.error("Error parsing SSE status update:", err);
      }
    });

    eventSource.onerror = () => {
      console.warn(
        "[Realtime] SSE stream error or disconnected. Falling back to optimized polling.",
      );
      setStreamState("polling");
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };

    return () => {
      eventSource.close();
      if (eventSourceRef.current === eventSource) {
        eventSourceRef.current = null;
      }
    };
  }, [pendingIdsString, pendingCount, enableSSE, applyStatusUpdate]);

  return {
    connectionStatus,
    pendingCount,
    isLive: connectionStatus === "live",
    isPolling: connectionStatus === "polling",
  };
}
