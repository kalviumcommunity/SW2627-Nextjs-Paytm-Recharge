import { api } from "@/services/api";
import type {
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from "@/types/otp";

export async function sendOtp(
  mobileNumberOrData: string | SendOtpRequest,
): Promise<SendOtpResponse> {
  const data: SendOtpRequest =
    typeof mobileNumberOrData === "string"
      ? { mobileNumber: mobileNumberOrData }
      : mobileNumberOrData;

  return api.post<SendOtpResponse>("/otp/send", data);
}

export async function verifyOtp(
  mobileNumber: string,
  otp: string,
): Promise<VerifyOtpResponse>;
export async function verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse>;
export async function verifyOtp(
  mobileNumberOrData: string | VerifyOtpRequest,
  otp?: string,
): Promise<VerifyOtpResponse> {
  const data: VerifyOtpRequest =
    typeof mobileNumberOrData === "string"
      ? { mobileNumber: mobileNumberOrData, otp: otp ?? "" }
      : mobileNumberOrData;

  return api.post<VerifyOtpResponse>("/otp/verify", data);
}

export const otpService = {
  sendOtp,
  verifyOtp,
};
