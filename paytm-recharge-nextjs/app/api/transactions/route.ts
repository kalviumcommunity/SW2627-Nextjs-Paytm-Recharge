import { NextResponse } from "next/server";
import { getTransactionHistory } from "@/services/transaction.server";

export async function GET() {
  try {
    const transactions = await getTransactionHistory();

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Transaction history error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch transaction history",
      },
      { status: 500 },
    );
  }
}