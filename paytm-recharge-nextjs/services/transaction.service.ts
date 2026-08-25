import { apiRequest } from "./api";
import type { Transaction } from "../types/transaction";

export function getTransactions() {
  return apiRequest<Transaction[]>("/transactions");
}

export function getTransactionStatus(transactionId: string) {
  return apiRequest<Transaction>(`/status/${transactionId}`);
}