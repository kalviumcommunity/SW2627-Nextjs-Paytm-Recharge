import { RechargeRequest, RechargeResponse } from "@/types/recharge";

export async function recharge(
  data: RechargeRequest
): Promise<RechargeResponse> {
  const res = await fetch("/api/recharge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
}