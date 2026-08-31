import { api } from "@/services/api";
import type { RechargeRequest, RechargeResponse } from "@/types/recharge";

export function recharge(
  data: RechargeRequest,
): Promise<RechargeResponse> {
  return api.post<RechargeResponse>("/recharge", data);
}