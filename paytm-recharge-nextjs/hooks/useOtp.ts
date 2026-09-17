"use client";

import { useMutation } from "@tanstack/react-query";
import { otpService } from "@/services/otp.service";
import type {
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from "@/types/otp";

export function useSendOtp() {
  return useMutation<SendOtpResponse, Error, SendOtpRequest | string>({
    mutationFn: (variables) => otpService.sendOtp(variables),
  });
}

export function useVerifyOtp() {
  return useMutation<VerifyOtpResponse, Error, VerifyOtpRequest>({
    mutationFn: (variables) => otpService.verifyOtp(variables),
  });
}
