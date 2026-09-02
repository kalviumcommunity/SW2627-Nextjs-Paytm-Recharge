import { NextRequest, NextResponse } from "next/server";
import { getBatchRechargeStatus } from "@/services/status.server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json({ transactions: [] }, { status: 200 });
    }

    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const transactions = await getBatchRechargeStatus(ids);

    return NextResponse.json({ transactions }, { status: 200 });
  } catch (error) {
    console.error("GET batch status error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch recharge statuses",
      },
      { status: 500 },
    );
  }
}
