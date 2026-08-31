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
  status: "PENDING" | "SUCCESS" | "FAILED";
  createdAt: string;
  updatedAt: string;
}