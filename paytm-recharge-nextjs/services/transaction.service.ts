export type TransactionStatus = "SUCCESS" | "FAILED" | "PENDING";

export interface Transaction {
  id: number;
  mobileNumber: string;
  operator: string;
  amount: number;
  plan: string;
  status: TransactionStatus;
  date: string;
}

interface TransactionApiResponse {
  id: number;
  mobileNumber: string;
  amount: number;
  status: TransactionStatus;
  createdAt: string;
  operator: {
    name: string;
  };
}

export async function getTransactions(): Promise<Transaction[]> {
  const res = await fetch("/api/transactions");

  if (!res.ok) {
    throw new Error("Failed to fetch transactions");
  }

  const data: TransactionApiResponse[] = await res.json();

  return data.map((transaction) => ({
    id: transaction.id,
    mobileNumber: transaction.mobileNumber,
    operator: transaction.operator.name,
    amount: transaction.amount,
    plan: "Recharge Plan",
    status: transaction.status,
    date: new Date(transaction.createdAt).toLocaleString(),
  }));
}