import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  if (
    typeof body.mobileNumber !== "string" ||
    !/^\d{10}$/.test(body.mobileNumber)
  ) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid mobile number",
      },
      { status: 400 },
    );
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = createHash("sha256").update(otp).digest("hex");

  await prisma.otpVerification.create({
  data: {
    mobileNumber: body.mobileNumber,
    otpHash,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  },
});

  return NextResponse.json(
    {
      success: true,
      message: "OTP endpoint reached",
    },
    { status: 200 },
  );
}