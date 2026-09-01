"use client";

import { useQueries, useQueryClient } from "@tanstack/react-query";
import { getTransactionStatus } from "@/services/status.service";
import type { Transaction } from "@/types/transaction";

export function usePolling(pendingTransactions: Transaction[]) {
  const queryClient = useQueryClient();

  return useQueries({
    queries: pendingTransactions.map((tx) => ({
      queryKey: ["transactionStatus", tx.transactionId],
      queryFn: async () => {
        const data = await getTransactionStatus(tx.transactionId);

        if (data.status !== "PENDING") {
          // Update the main transactions list cache
          queryClient.setQueryData<Transaction[]>(["transactions"], (old) => {
            if (!old) return old;
            return old.map((t) =>
              t.transactionId === data.transactionId
                ? { ...t, status: data.status }
                : t
            );
          });
        }

        return data;
      },
      refetchInterval: (query: any) => {
        const currentStatus = query.state.data?.status || "PENDING";
        return currentStatus === "PENDING" ? 5000 : false;
      },
    })),
  });
}
