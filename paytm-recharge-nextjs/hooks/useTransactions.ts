import { useQuery } from "@tanstack/react-query";
import { transactionService } from "@/services/transaction.service";

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: transactionService.getTransactions,

    refetchInterval: 5000,
  });
}