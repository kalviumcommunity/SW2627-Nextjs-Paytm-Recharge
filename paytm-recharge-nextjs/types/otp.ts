export interface SendOtpRequest {
  mobileNumber: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
}

export interface VerifyOtpRequest {
  mobileNumber: string;
  otp: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  verified?: boolean;
}
