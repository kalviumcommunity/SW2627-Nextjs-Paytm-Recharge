"use client";

import type { Transaction } from "@/types/transaction";
import { useOptimizedPolling, OptimizedPollingOptions } from "./useOptimizedPolling";

/**
 * Backward-compatible optimized polling hook.
 * Uses batch querying, exponential backoff, jitter, and tab visibility awareness.
 */
export function usePolling(
  pendingTransactions: Transaction[],
  options?: OptimizedPollingOptions,
) {
  return useOptimizedPolling(pendingTransactions, options);
}

