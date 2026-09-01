export async function getTransactionStatus(
  transactionId: string
): Promise<{ transactionId: string; status: "PENDING" | "SUCCESS" | "FAILED" }> {
  const res = await fetch(`/api/status/${transactionId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch transaction status");
  }

  return res.json();
}
