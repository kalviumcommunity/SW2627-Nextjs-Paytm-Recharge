export interface RechargeRequest {
  mobileNumber: string;
  operatorId: number;
  amount: number;
}

export interface RechargeResponse {
  transactionId: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
}