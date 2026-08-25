export interface Transaction {
  id: string;
  transactionId: string;
  mobileNumber: string;
  operatorId: number;
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED";
  createdAt: string;
  updatedAt: string;
}