import type { Transaction } from "@/types/transaction";

export async function getTransactions(): Promise<Transaction[]> {
  const res = await fetch("/api/transactions");

  if (!res.ok) {
    throw new Error("Failed to fetch transactions");
  }

  return res.json();
}