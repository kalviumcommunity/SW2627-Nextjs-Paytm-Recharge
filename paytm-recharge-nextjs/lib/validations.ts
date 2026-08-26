import type { RechargeRequest } from "@/types/recharge";

export function validateRechargeRequest(
  data: unknown,
): { valid: true; data: RechargeRequest } | { valid: false; error: string } {
  if (!data || typeof data !== "object") {
    return {
      valid: false,
      error: "Invalid request body",
    };
  }

  const body = data as Record<string, unknown>;

  if (
    typeof body.mobileNumber !== "string" ||
    !/^[6-9]\d{9}$/.test(body.mobileNumber)
  ) {
    return {
      valid: false,
      error: "Mobile number must be a valid 10-digit Indian mobile number",
    };
  }

  if (
    typeof body.operatorId !== "number" ||
    !Number.isInteger(body.operatorId) ||
    body.operatorId <= 0
  ) {
    return {
      valid: false,
      error: "Operator ID must be a positive integer",
    };
  }

  if (
    typeof body.amount !== "number" ||
    !Number.isFinite(body.amount) ||
    body.amount <= 0
  ) {
    return {
      valid: false,
      error: "Amount must be greater than zero",
    };
  }

  return {
    valid: true,
    data: {
      mobileNumber: body.mobileNumber,
      operatorId: body.operatorId,
      amount: body.amount,
    },
  };
}