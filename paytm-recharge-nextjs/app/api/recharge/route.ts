import { NextResponse } from "next/server";
import { validateRechargeRequest } from "@/lib/validations";
import { createRechargeTransaction } from "@/services/recharge.server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = validateRechargeRequest(body);

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 400 },
      );
    }

    const transaction = await createRechargeTransaction(validation.data);

    return NextResponse.json(
      {
        transactionId: transaction.transactionId,
        status: transaction.status,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Recharge error:", error);

    if (error instanceof Error && error.message === "Operator not found") {
      return NextResponse.json(
        {
          success: false,
          error: "Operator not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create recharge",
      },
      { status: 500 },
    );
  }
}