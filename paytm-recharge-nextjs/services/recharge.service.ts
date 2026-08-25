import { apiRequest } from "./api";
import type { RechargeRequest, RechargeResponse } from "../types/recharge";

export function createRecharge(data: RechargeRequest) {
  return apiRequest<RechargeResponse>("/recharge", {
    method: "POST",
    body: JSON.stringify(data),
  });
}