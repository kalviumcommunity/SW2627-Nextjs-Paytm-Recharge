import type { TransactionStatus } from "./transaction";

export interface RechargeRequest {
  mobileNumber: string;
  operatorId: number;
  amount: number;
}

export interface RechargeResponse {
  transactionId: string;
  status: TransactionStatus;
}
