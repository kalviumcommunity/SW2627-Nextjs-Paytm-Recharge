import { NextRequest, NextResponse } from "next/server";
import { getBatchRechargeStatus } from "@/services/status.server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const transactionIds = Array.isArray(body.transactionIds)
      ? (body.transactionIds as string[])
      : [];

    if (!transactionIds.length) {
      return NextResponse.json({ transactions: [] }, { status: 200 });
    }

    const transactions = await getBatchRechargeStatus(transactionIds);

    return NextResponse.json({ transactions }, { status: 200 });
  } catch (error) {
    console.error("Batch status error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch batch recharge statuses",
      },
      { status: 500 },
    );
  }
}
