import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { 
  getZCreditClient, 
  ZCreditCurrency, 
  ZCreditLanguage,
  createCartItems 
} from "@/lib/payments/zcredit";
import { prisma } from "@/lib/db/prisma";

interface CartItem {
  id: string;
  name: string;
  thumbnailUrl?: string;
  price: number;
  quantity: number;
  jewelryType: string;
  material: string;
}

interface CreatePaymentRequest {
  items: CartItem[];
  shippingInfo: {
    name: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    postalCode?: string;
    country: string;
  };
  locale: string;
  installments?: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body: CreatePaymentRequest = await request.json();

    const { items, shippingInfo, locale, installments = 1 } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "No items in cart" },
        { status: 400 }
      );
    }

    if (!shippingInfo || !shippingInfo.name || !shippingInfo.email || !shippingInfo.phone) {
      return NextResponse.json(
        { success: false, error: "Missing shipping information" },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = subtotal > 500 ? 0 : 35; // Free shipping over 500 ILS
    const taxRate = 0.17; // 17% VAT
    const tax = (subtotal + shippingCost) * taxRate;
    const total = Math.round((subtotal + shippingCost + tax) * 100) / 100; // Round to 2 decimals

    // Create order in database
    const order = await prisma.order.create({
      data: {
        userId: session?.user?.id || undefined,
        status: "pending",
        total,
        subtotal,
        tax,
        shipping: shippingCost,
        currency: "ILS",
        customerName: shippingInfo.name,
        customerEmail: shippingInfo.email,
        customerPhone: shippingInfo.phone,
        shippingAddress: {
          street: shippingInfo.street,
          city: shippingInfo.city,
          postalCode: shippingInfo.postalCode,
          country: shippingInfo.country,
        },
        itemsJson: JSON.parse(JSON.stringify(items)),
      },
    });

    // Get the base URL for callbacks
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;

    // Create Z-Credit payment
    const zcreditClient = getZCreditClient();
    
    const cartItems = createCartItems(
      items.map((item) => ({
        name: item.name,
        imageUrl: item.thumbnailUrl,
        sku: item.id,
        quantity: item.quantity,
        price: item.price,
      }))
    );

    const result = await zcreditClient.createPayment({
      paymentSum: total,
      paymentsNumber: installments,
      language: locale === "he" ? ZCreditLanguage.Hebrew : ZCreditLanguage.English,
      currency: ZCreditCurrency.NIS,
      uniqueId: order.id,
      itemDescription: items.length === 1 
        ? items[0].name 
        : `${items.length} ${locale === "he" ? "פריטים" : "items"}`,
      itemQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      redirectUrl: `${baseUrl}/${locale}/checkout/complete?orderId=${order.id}`,
      notifyUrl: `${baseUrl}/api/payments/zcredit/webhook`,
      cancelUrl: `${baseUrl}/${locale}/checkout?cancelled=true`,
      customerName: shippingInfo.name,
      customerPhone: shippingInfo.phone,
      customerEmail: shippingInfo.email,
      cartItems,
      isResponsive: true,
      cssType: 4, // Modern responsive style
      numberOfFailures: 3,
      isIframe: false, // Full page redirect
    });

    if (!result.success || !result.paymentUrl) {
      // Update order status to failed
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "failed", notes: result.error },
      });

      return NextResponse.json(
        { success: false, error: result.error || "Failed to create payment" },
        { status: 500 }
      );
    }

    // Update order with payment info
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentGateway: "zcredit",
        paymentReference: result.guid,
      },
    });

    return NextResponse.json({
      success: true,
      paymentUrl: result.paymentUrl,
      orderId: order.id,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
