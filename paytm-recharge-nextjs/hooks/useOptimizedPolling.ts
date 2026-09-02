"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getBatchTransactionStatus } from "@/services/status.service";
import type { Transaction } from "@/types/transaction";

export interface OptimizedPollingOptions {
  enabled?: boolean;
  initialIntervalMs?: number;
  maxIntervalMs?: number;
  backoffFactor?: number;
  maxAttempts?: number;
  onStatusChange?: (updated: { transactionId: string; status: "PENDING" | "SUCCESS" | "FAILED" }) => void;
}

const DEFAULT_INITIAL_INTERVAL = 2000;
const DEFAULT_MAX_INTERVAL = 12000;
const DEFAULT_BACKOFF_FACTOR = 1.5;
const DEFAULT_MAX_ATTEMPTS = 30;

export function useOptimizedPolling(
  pendingTransactions: Transaction[],
  options: OptimizedPollingOptions = {},
) {
  const {
    enabled = true,
    initialIntervalMs = DEFAULT_INITIAL_INTERVAL,
    maxIntervalMs = DEFAULT_MAX_INTERVAL,
    backoffFactor = DEFAULT_BACKOFF_FACTOR,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    onStatusChange,
  } = options;

  const queryClient = useQueryClient();

  const attemptsRef = useRef<number>(0);
  const currentIntervalRef = useRef<number>(initialIntervalMs);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef<boolean>(false);
  const isTabVisibleRef = useRef<boolean>(true);

  // Extract pending IDs for stable comparison
  const pendingIds = pendingTransactions.map((tx) => tx.transactionId);
  const pendingIdsString = pendingIds.sort().join(",");

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const updateTransactionsCache = useCallback(
    (updates: Array<{ transactionId: string; status: "PENDING" | "SUCCESS" | "FAILED" }>) => {
      if (!updates.length) return;

      queryClient.setQueryData<Transaction[]>(["transactions"], (old) => {
        if (!old) return old;
        const updateMap = new Map(updates.map((u) => [u.transactionId, u.status]));
        return old.map((t) => {
          const newStatus = updateMap.get(t.transactionId);
          return newStatus ? { ...t, status: newStatus } : t;
        });
      });

      updates.forEach((u) => {
        onStatusChange?.(u);
      });
    },
    [queryClient, onStatusChange],
  );

  const pollBatch = useCallback(async () => {
    if (!enabled || !pendingIds.length || isPollingRef.current || !isTabVisibleRef.current) {
      return;
    }

    if (attemptsRef.current >= maxAttempts) {
      console.warn(
        `[OptimizedPolling] Max polling attempts (${maxAttempts}) reached for pending transactions.`,
      );
      return;
    }

    isPollingRef.current = true;
    attemptsRef.current += 1;

    try {
      const results = await getBatchTransactionStatus(pendingIds);

      // Check if any transactions changed from PENDING
      const resolved = results.filter((r) => r.status !== "PENDING");

      if (resolved.length > 0) {
        updateTransactionsCache(resolved);
        // Reset backoff to fast interval when activity happens
        currentIntervalRef.current = initialIntervalMs;
        attemptsRef.current = 0;
      } else {
        // Exponential backoff with small random jitter (+/- 250ms)
        const jitter = (Math.random() - 0.5) * 500;
        const nextInterval = Math.min(
          currentIntervalRef.current * backoffFactor + jitter,
          maxIntervalMs,
        );
        currentIntervalRef.current = Math.max(initialIntervalMs, nextInterval);
      }
    } catch (error) {
      console.error("[OptimizedPolling] Batch polling error:", error);
      // Double the interval on error to avoid hammering
      currentIntervalRef.current = Math.min(
        currentIntervalRef.current * 2,
        maxIntervalMs,
      );
    } finally {
      isPollingRef.current = false;

      // Schedule next tick if still enabled and there are remaining pending items
      if (enabled && pendingIds.length > 0) {
        clearTimer();
        timerRef.current = setTimeout(pollBatch, currentIntervalRef.current);
      }
    }
  }, [
    enabled,
    pendingIds,
    maxAttempts,
    initialIntervalMs,
    maxIntervalMs,
    backoffFactor,
    updateTransactionsCache,
    clearTimer,
  ]);

  // Reset polling interval & attempt counter when pending transactions change
  useEffect(() => {
    if (!enabled || !pendingIds.length) {
      clearTimer();
      attemptsRef.current = 0;
      return;
    }

    attemptsRef.current = 0;
    currentIntervalRef.current = initialIntervalMs;
    clearTimer();

    // Start initial poll after 1 second
    timerRef.current = setTimeout(pollBatch, 1000);

    return () => {
      clearTimer();
    };
  }, [pendingIdsString, pendingIds.length, enabled, initialIntervalMs, pollBatch, clearTimer]);


  // Tab visibility and network connectivity listeners
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible";
      isTabVisibleRef.current = isVisible;

      if (isVisible && enabled && pendingIds.length > 0) {
        // User returned to tab; immediately poll once to sync status
        currentIntervalRef.current = initialIntervalMs;
        clearTimer();
        pollBatch();
      }
    };

    const handleOnline = () => {
      if (enabled && pendingIds.length > 0) {
        currentIntervalRef.current = initialIntervalMs;
        clearTimer();
        pollBatch();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [enabled, pendingIds.length, initialIntervalMs, pollBatch, clearTimer]);
}
