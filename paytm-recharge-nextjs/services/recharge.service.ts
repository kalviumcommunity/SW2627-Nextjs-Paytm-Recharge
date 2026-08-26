import { api } from "./api";
import {
  RechargeRequest,
  RechargeResponse,
} from "@/types/recharge";

export const rechargeService = {
  createRecharge(data: RechargeRequest) {
    return api.post<RechargeResponse>("/recharge", data);
  },
};