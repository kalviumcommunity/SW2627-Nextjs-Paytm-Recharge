import { NextRequest, NextResponse } from "next/server";
import { getBatchRechargeStatus } from "@/services/status.server";

export async function POST(request: NextRequest) {
  try {
    let body: { transactionIds?: unknown };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
        },
        { status: 400 },
      );
    }

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
