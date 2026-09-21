import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const MAX_OTP_ATTEMPTS = 3;

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

  if (typeof body.otp !== "string" || !/^\d{6}$/.test(body.otp)) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid OTP",
      },
      { status: 400 },
    );
  }

  const otpRecord = await prisma.otpVerification.findFirst({
    where: {
      mobileNumber: body.mobileNumber,
      verifiedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!otpRecord) {
    return NextResponse.json(
      {
        success: false,
        message: "OTP not found",
      },
      { status: 404 },
    );
  }

  if (otpRecord.expiresAt < new Date()) {
    return NextResponse.json(
      {
        success: false,
        message: "OTP has expired",
      },
      { status: 400 },
    );
  }

  if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many OTP attempts",
      },
      { status: 400 },
    );
  }

  const otpHash = createHash("sha256").update(body.otp).digest("hex");

  if (otpHash !== otpRecord.otpHash) {
    await prisma.otpVerification.update({
      where: {
        id: otpRecord.id,
      },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(
      {
        success: false,
        message: "Invalid OTP",
      },
      { status: 400 },
    );
  }

  await prisma.otpVerification.update({
    where: {
      id: otpRecord.id,
    },
    data: {
      verifiedAt: new Date(),
    },
  });

  return NextResponse.json(
    {
      success: true,
      message: "OTP validation passed",
    },
    { status: 200 },
  );
}
