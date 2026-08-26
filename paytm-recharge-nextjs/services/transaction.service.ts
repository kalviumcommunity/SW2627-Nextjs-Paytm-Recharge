import { api } from "./api";
import { Transaction } from "@/types/transaction";

export const transactionService = {
  getTransactions() {
    return api.get<Transaction[]>("/transactions");
  },

  getStatus(transactionId: string) {
    return api.get<Transaction>(
      `/status/${transactionId}`
    );
  },
};