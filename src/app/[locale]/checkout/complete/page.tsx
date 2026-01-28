"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Check, XCircle, Loader2, Package, Mail, ArrowRight } from "lucide-react";

interface OrderDetails {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  customerEmail: string;
  customerName: string;
}

export default function CheckoutCompletePage() {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError("No order ID provided");
      setLoading(false);
      return;
    }

    // Fetch order details
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/user/orders/${orderId}`);
        if (response.ok) {
          const data = await response.json();
          setOrder(data.order);
          
          // Clear cart if payment was successful
          if (data.order.status === "paid") {
            localStorage.removeItem("gold-jewelry-cart");
          }
        } else {
          setError("Order not found");
        }
      } catch {
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    // Poll for order status updates (Z-Credit webhook may not have processed yet)
    const pollOrder = async () => {
      let attempts = 0;
      const maxAttempts = 10;
      
      const poll = async () => {
        attempts++;
        await fetchOrder();
        
        // If still pending and not max attempts, poll again
        if (order?.status === "pending" && attempts < maxAttempts) {
          setTimeout(poll, 2000);
        }
      };
      
      poll();
    };

    pollOrder();
  }, [orderId, order?.status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-20 h-20 bg-dark-800 border border-gold-500/20 rounded-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-gold-400 animate-spin" />
            </div>
          </div>
          <p className="text-dark-300">{t("loadingOrder")}</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-dark-900 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center animate-fade-in-up">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl" />
            <div className="relative w-24 h-24 bg-dark-800 border border-red-500/30 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-4 text-dark-100">{t("orderError")}</h1>
          <p className="text-dark-400 mb-8">{error || t("orderNotFound")}</p>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-400 text-dark-900 font-semibold rounded-xl transition-all shadow-lg shadow-gold-500/25 hover:shadow-gold-400/40 hover:shadow-xl"
          >
            {t("returnHome")}
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = order.status === "paid";
  const isFailed = order.status === "failed";

  if (isFailed) {
    return (
      <div className="min-h-screen bg-dark-900 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center animate-fade-in-up">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl" />
            <div className="relative w-24 h-24 bg-dark-800 border border-red-500/30 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-4 text-dark-100">{t("paymentFailed")}</h1>
          <p className="text-dark-400 mb-8">{t("paymentFailedMessage")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/checkout`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-400 text-dark-900 font-semibold rounded-xl transition-all shadow-lg shadow-gold-500/25 hover:shadow-gold-400/40 hover:shadow-xl"
            >
              {t("tryAgain")}
            </Link>
            <Link
              href={`/${locale}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-dark-800 text-dark-200 border border-dark-600 font-semibold rounded-xl transition-all hover:bg-dark-700"
            >
              {t("returnHome")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center animate-fade-in-up">
          {/* Success Icon */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-gold-500/30 rounded-full blur-xl animate-pulse" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-gold-500 to-gold-400 rounded-full flex items-center justify-center shadow-xl shadow-gold-500/30">
              <Check className="w-12 h-12 text-dark-900" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold mb-4 text-gradient-gold-bright">
            {isPaid ? t("orderConfirmed") : t("orderPending")}
          </h1>
          <p className="text-dark-300 mb-8">
            {isPaid ? t("thankYou") : t("pendingMessage")}
          </p>

          {/* Order Details Card */}
          <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 mb-8 text-start">
            <h2 className="text-lg font-semibold mb-4 text-dark-100">{t("orderDetails")}</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-dark-700">
                <span className="text-dark-400">{t("orderNumber")}</span>
                <span className="font-mono text-gold-400">{order.orderNumber}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-dark-700">
                <span className="text-dark-400">{t("status")}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isPaid 
                    ? "bg-green-500/20 text-green-400" 
                    : "bg-yellow-500/20 text-yellow-400"
                }`}>
                  {isPaid ? t("statusPaid") : t("statusPending")}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-dark-700">
                <span className="text-dark-400">{t("total")}</span>
                <span className="text-lg font-bold text-gradient-gold-bright">
                  ₪{order.total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Email Notification */}
            <div className="mt-6 p-4 bg-dark-850 rounded-xl flex items-start gap-3">
              <Mail className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-dark-200">
                  {t("confirmationEmailSent")}
                </p>
                <p className="text-sm text-dark-400 mt-1">{order.customerEmail}</p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 mb-8 text-start">
            <h2 className="text-lg font-semibold mb-4 text-dark-100">{t("nextSteps")}</h2>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold-400 font-medium">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-dark-100">{t("step1Title")}</h3>
                  <p className="text-sm text-dark-400">{t("step1Desc")}</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold-400 font-medium">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-dark-100">{t("step2Title")}</h3>
                  <p className="text-sm text-dark-400">{t("step2Desc")}</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-gold-400" />
                </div>
                <div>
                  <h3 className="font-medium text-dark-100">{t("step3Title")}</h3>
                  <p className="text-sm text-dark-400">{t("step3Desc")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/account/orders`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-400 text-dark-900 font-semibold rounded-xl transition-all shadow-lg shadow-gold-500/25 hover:shadow-gold-400/40 hover:shadow-xl"
            >
              {t("viewOrders")}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={`/${locale}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-dark-800 text-dark-200 border border-dark-600 font-semibold rounded-xl transition-all hover:bg-dark-700"
            >
              {t("continueShopping")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
