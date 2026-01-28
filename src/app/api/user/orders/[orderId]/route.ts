import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { orderId } = await context.params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        subtotal: true,
        tax: true,
        shipping: true,
        currency: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        shippingAddress: true,
        itemsJson: true,
        paymentGateway: true,
        paymentApproval: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
