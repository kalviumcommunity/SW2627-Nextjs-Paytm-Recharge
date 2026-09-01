import { NextResponse } from "next/server";
import { getRechargeStatus } from "@/services/status.server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const transaction = await getRechargeStatus(id);

    return NextResponse.json(transaction, { status: 200 });
  } catch (error) {
    console.error("Recharge status error:", error);

    if (
      error instanceof Error &&
      error.message === "Transaction not found"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Transaction not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch recharge status",
      },
      { status: 500 },
    );
  }
}