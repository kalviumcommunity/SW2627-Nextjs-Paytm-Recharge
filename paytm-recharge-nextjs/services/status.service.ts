export interface TransactionStatusResult {
  transactionId: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  updatedAt?: string;
}

export async function getTransactionStatus(
  transactionId: string,
): Promise<TransactionStatusResult> {
  const res = await fetch(`/api/status/${transactionId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch transaction status");
  }

  return res.json();
}

export async function getBatchTransactionStatus(
  transactionIds: string[],
): Promise<TransactionStatusResult[]> {
  if (!transactionIds.length) return [];

  const res = await fetch("/api/status/batch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transactionIds }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch batch transaction statuses");
  }

  const data = await res.json();
  return data.transactions || [];
}

