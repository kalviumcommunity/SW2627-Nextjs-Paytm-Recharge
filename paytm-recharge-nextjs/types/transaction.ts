export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface Transaction {
  id: number;
  transactionId: string;
  mobileNumber: string;
  operatorId: number;
  operator: {
    id: number;
    name: string;
  };
  amount: number;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
}
