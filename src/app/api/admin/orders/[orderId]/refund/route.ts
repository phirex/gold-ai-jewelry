import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { getZCreditClient } from "@/lib/payments/zcredit";

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

/**
 * Process a refund for an order
 * Admin only endpoint
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { orderId } = await context.params;
    const body = await request.json();
    const { amount } = body; // Optional partial refund amount

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.status !== "paid") {
      return NextResponse.json(
        { success: false, error: "Order cannot be refunded - not in paid status" },
        { status: 400 }
      );
    }

    if (!order.paymentReference) {
      return NextResponse.json(
        { success: false, error: "No payment reference found for this order" },
        { status: 400 }
      );
    }

    // Process refund
    const zcreditClient = getZCreditClient();
    const result = await zcreditClient.refundTransaction(
      order.paymentReference,
      amount
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: amount && amount < order.total ? "partial_refund" : "refunded",
        notes: `${order.notes || ""}\nRefund processed: ${result.refundGuid}`.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      refundGuid: result.refundGuid,
    });
  } catch (error) {
    console.error("Refund error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process refund" },
      { status: 500 }
    );
  }
}
