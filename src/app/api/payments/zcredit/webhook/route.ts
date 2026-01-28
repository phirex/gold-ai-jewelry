import { NextRequest, NextResponse } from "next/server";
import { ZCreditClient, ZCreditCallbackData } from "@/lib/payments/zcredit";
import { prisma } from "@/lib/db/prisma";

/**
 * Z-Credit Webhook Handler
 * Receives payment notifications from Z-Credit after successful/failed payments
 */
export async function POST(request: NextRequest) {
  try {
    // Parse form data from Z-Credit
    const formData = await request.formData();
    const callbackData = ZCreditClient.parseCallback(formData);

    console.log("Z-Credit webhook received:", {
      orderId: callbackData.UniqueID,
      approvalNumber: callbackData.ApprovalNumber,
      guid: callbackData.GUID,
      errorCode: callbackData.ErrorCode,
    });

    const orderId = callbackData.UniqueID;

    if (!orderId) {
      console.error("Z-Credit webhook: No order ID in callback");
      return new NextResponse("Missing order ID", { status: 400 });
    }

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      console.error(`Z-Credit webhook: Order not found: ${orderId}`);
      return new NextResponse("Order not found", { status: 404 });
    }

    // Validate the callback
    const isValid = ZCreditClient.validateCallback(callbackData);

    if (isValid) {
      // Payment successful
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "paid",
          paymentReference: callbackData.GUID,
          paymentApproval: callbackData.ApprovalNumber,
          paymentDetails: JSON.stringify({
            last4Digits: callbackData.Last4Digits,
            cardBrand: callbackData.CardBrand,
            installments: callbackData.Installments,
            referenceNumber: callbackData.ReferenceNumber,
            transactionSum: callbackData.TransactionSum,
            paidAt: new Date().toISOString(),
          }),
        },
      });

      console.log(`Z-Credit webhook: Order ${orderId} marked as paid`);

      // TODO: Send confirmation email
      // await sendOrderConfirmationEmail(order, callbackData);

    } else {
      // Payment failed
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "failed",
          notes: callbackData.ErrorMessage || `Error code: ${callbackData.ErrorCode}`,
        },
      });

      console.log(`Z-Credit webhook: Order ${orderId} payment failed: ${callbackData.ErrorMessage}`);
    }

    // Z-Credit expects an empty response with 200 status
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Z-Credit webhook error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

// Also handle GET requests (sometimes used for verification)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // If there are callback parameters, process them
  if (searchParams.has("UniqueID")) {
    const callbackData: ZCreditCallbackData = {
      UniqueID: searchParams.get("UniqueID") || "",
      ApprovalNumber: searchParams.get("ApprovalNumber") || undefined,
      GUID: searchParams.get("GUID") || undefined,
      ReferenceNumber: searchParams.get("ReferenceNumber") || undefined,
      Last4Digits: searchParams.get("Last4Digits") || undefined,
      CardBrand: searchParams.get("CardBrand") || undefined,
      TransactionSum: searchParams.get("TransactionSum") || undefined,
      ErrorCode: searchParams.get("ErrorCode") || undefined,
      ErrorMessage: searchParams.get("ErrorMessage") || undefined,
    };

    console.log("Z-Credit webhook (GET):", callbackData);

    // Process same as POST
    const orderId = callbackData.UniqueID;
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (order) {
        const isValid = ZCreditClient.validateCallback(callbackData);
        
        await prisma.order.update({
          where: { id: orderId },
          data: isValid
            ? {
                status: "paid",
                paymentReference: callbackData.GUID,
                paymentApproval: callbackData.ApprovalNumber,
                paymentDetails: JSON.stringify({
                  last4Digits: callbackData.Last4Digits,
                  cardBrand: callbackData.CardBrand,
                  referenceNumber: callbackData.ReferenceNumber,
                  transactionSum: callbackData.TransactionSum,
                  paidAt: new Date().toISOString(),
                }),
              }
            : {
                status: "failed",
                notes: callbackData.ErrorMessage || `Error code: ${callbackData.ErrorCode}`,
              },
        });
      }
    }
  }

  return new NextResponse("OK", { status: 200 });
}
