export interface RechargeRequest {
  mobileNumber: string;
  operator: string;
  amount: number;
}

export interface RechargeResponse {
  success: boolean;
  transactionId: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
}