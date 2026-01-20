"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/pricing/calculator";
import { ShoppingBag, CreditCard, Truck, ChevronLeft, Check, Sparkles, X, ZoomIn } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ShippingForm {
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const tCart = useTranslations("cart");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { items, subtotal, clearCart } = useCart();
  const [step, setStep] = useState<"shipping" | "payment" | "confirmation">("shipping");
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [shippingForm, setShippingForm] = useState<ShippingForm>({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    postalCode: "",
    country: "Israel",
  });

  // Calculate totals
  const shippingCost = subtotal > 500 ? 0 : 35; // Free shipping over 500 ILS
  const taxRate = 0.17; // 17% VAT in Israel
  const tax = (subtotal + shippingCost) * taxRate;
  const total = subtotal + shippingCost + tax;

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("payment");
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // TODO: Integrate with Tranzila payment gateway
    // For now, simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // On success, clear cart and show confirmation
    clearCart();
    setStep("confirmation");
    setIsProcessing(false);
  };

  if (items.length === 0 && step !== "confirmation") {
    return (
      <div className="min-h-screen bg-dark-900 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-20 h-20 bg-dark-800 border border-gold-500/20 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-gold-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-4 text-dark-100">{tCart("empty")}</h1>
          <p className="text-dark-400 mb-8">
            {tCart("emptySubtitle")}
          </p>
          <Link
            href={`/${locale}/design`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-400 text-dark-900 font-semibold rounded-xl transition-all shadow-lg shadow-gold-500/25 hover:shadow-gold-400/40 hover:shadow-xl"
          >
            <Sparkles className="w-5 h-5" />
            {tCart("startDesigning")}
          </Link>
        </div>
      </div>
    );
  }

  if (step === "confirmation") {
    return (
      <div className="min-h-screen bg-dark-900 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center animate-fade-in-up">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-gold-500/30 rounded-full blur-xl animate-pulse" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-gold-500 to-gold-400 rounded-full flex items-center justify-center shadow-xl shadow-gold-500/30">
              <Check className="w-12 h-12 text-dark-900" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4 text-gradient-gold-bright">{t("orderConfirmed")}</h1>
          <p className="text-dark-300 mb-8">
            {t("thankYou")}
          </p>
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

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <Link
            href={`/${locale}/design`}
            className="inline-flex items-center gap-2 text-dark-400 hover:text-gold-400 transition-colors mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            {tCart("continueShopping")}
          </Link>
          <h1 className="text-3xl font-bold text-gradient-gold-bright">{t("title")}</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {/* Progress Steps */}
            <div className="flex items-center gap-4 mb-8">
              <div
                className={`flex items-center gap-2 ${
                  step === "shipping" ? "text-gold-400" : "text-dark-500"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    step === "shipping"
                      ? "bg-gradient-to-r from-gold-500 to-gold-400 text-dark-900 shadow-lg shadow-gold-500/30"
                      : "bg-dark-800 border border-dark-700"
                  }`}
                >
                  <Truck className="w-5 h-5" />
                </div>
                <span className="font-medium">{t("shipping.title")}</span>
              </div>
              <div className={`flex-1 h-0.5 rounded-full ${step === "payment" ? "bg-gradient-to-r from-gold-500 to-gold-400" : "bg-dark-700"}`} />
              <div
                className={`flex items-center gap-2 ${
                  step === "payment" ? "text-gold-400" : "text-dark-500"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    step === "payment"
                      ? "bg-gradient-to-r from-gold-500 to-gold-400 text-dark-900 shadow-lg shadow-gold-500/30"
                      : "bg-dark-800 border border-dark-700"
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="font-medium">{t("payment.title")}</span>
              </div>
            </div>

            {/* Shipping Form */}
            {step === "shipping" && (
              <form
                onSubmit={handleShippingSubmit}
                className="bg-dark-800 rounded-2xl p-6 border border-dark-700 animate-fade-in-up"
              >
                <h2 className="text-xl font-semibold mb-6 text-dark-100">{t("shipping.title")}</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 text-dark-200">
                      {t("shipping.name")} *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingForm.name}
                      onChange={(e) =>
                        setShippingForm({ ...shippingForm, name: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-dark-700 rounded-xl bg-dark-850 text-dark-100 placeholder:text-dark-500 focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-dark-200">
                      {t("shipping.email")} *
                    </label>
                    <input
                      type="email"
                      required
                      value={shippingForm.email}
                      onChange={(e) =>
                        setShippingForm({ ...shippingForm, email: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-dark-700 rounded-xl bg-dark-850 text-dark-100 placeholder:text-dark-500 focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-dark-200">
                      {t("shipping.phone")} *
                    </label>
                    <input
                      type="tel"
                      required
                      value={shippingForm.phone}
                      onChange={(e) =>
                        setShippingForm({ ...shippingForm, phone: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-dark-700 rounded-xl bg-dark-850 text-dark-100 placeholder:text-dark-500 focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500/50 transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 text-dark-200">
                      {t("shipping.street")} *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingForm.street}
                      onChange={(e) =>
                        setShippingForm({ ...shippingForm, street: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-dark-700 rounded-xl bg-dark-850 text-dark-100 placeholder:text-dark-500 focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-dark-200">
                      {t("shipping.city")} *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingForm.city}
                      onChange={(e) =>
                        setShippingForm({ ...shippingForm, city: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-dark-700 rounded-xl bg-dark-850 text-dark-100 placeholder:text-dark-500 focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-dark-200">
                      {t("shipping.postalCode")}
                    </label>
                    <input
                      type="text"
                      value={shippingForm.postalCode}
                      onChange={(e) =>
                        setShippingForm({ ...shippingForm, postalCode: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-dark-700 rounded-xl bg-dark-850 text-dark-100 placeholder:text-dark-500 focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500/50 transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 text-dark-200">
                      {t("shipping.country")}
                    </label>
                    <select
                      value={shippingForm.country}
                      onChange={(e) =>
                        setShippingForm({ ...shippingForm, country: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-dark-700 rounded-xl bg-dark-850 text-dark-100 focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500/50 transition-all"
                    >
                      <option value="Israel">Israel</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-gold-500 to-gold-400 text-dark-900 font-semibold rounded-xl transition-all shadow-lg shadow-gold-500/25 hover:shadow-gold-400/40 hover:shadow-xl"
                >
                  {tCommon("continue")}
                </button>
              </form>
            )}

            {/* Payment Form */}
            {step === "payment" && (
              <form
                onSubmit={handlePaymentSubmit}
                className="bg-dark-800 rounded-2xl p-6 border border-dark-700 animate-fade-in-up"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-dark-100">{t("payment.title")}</h2>
                  <button
                    type="button"
                    onClick={() => setStep("shipping")}
                    className="text-sm text-gold-400 hover:text-gold-300 hover:underline transition-colors"
                  >
                    {tCommon("back")}
                  </button>
                </div>

                {/* Payment Method Selection */}
                <div className="space-y-4 mb-6">
                  <label className="flex items-center gap-4 p-4 border border-dark-700 rounded-xl cursor-pointer hover:border-gold-500/50 hover:bg-dark-700/50 transition-all">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      defaultChecked
                      className="w-4 h-4 text-gold-500 bg-dark-800 border-dark-600 focus:ring-gold-500/50"
                    />
                    <CreditCard className="w-5 h-5 text-gold-400" />
                    <span className="text-dark-200">{t("payment.card")}</span>
                  </label>
                  <label className="flex items-center gap-4 p-4 border border-dark-700 rounded-xl cursor-pointer hover:border-gold-500/50 hover:bg-dark-700/50 transition-all">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="installments"
                      className="w-4 h-4 text-gold-500 bg-dark-800 border-dark-600 focus:ring-gold-500/50"
                    />
                    <span className="text-dark-200">{t("payment.installments")}</span>
                    <span className="text-sm text-dark-500">({t("meshulam")})</span>
                  </label>
                </div>

                {/* Card Details (Placeholder - will be replaced with Tranzila iframe) */}
                <div className="p-6 bg-dark-850 rounded-lg mb-6 border border-dark-700">
                  <p className="text-center text-dark-400">
                    {t("paymentProvider")}
                  </p>
                  <p className="text-center text-sm text-dark-500 mt-2">
                    {t("paymentSecure")}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 px-4 bg-gradient-to-r from-gold-500 to-gold-400 disabled:from-dark-600 disabled:to-dark-700 disabled:text-dark-400 text-dark-900 font-semibold rounded-xl transition-all shadow-lg shadow-gold-500/25 hover:shadow-gold-400/40 hover:shadow-xl disabled:shadow-none"
                >
                  {isProcessing ? t("processing") : t("placeOrder")}
                </button>
              </form>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 sticky top-24 animate-fade-in-up delay-100">
              <h2 className="text-xl font-semibold mb-4 text-dark-100">{t("summary.title")}</h2>

              {/* Items */}
              <ul className="divide-y divide-dark-700 mb-4">
                {items.map((item) => (
                  <li key={item.id} className="py-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => item.thumbnailUrl && setPreviewImage({ url: item.thumbnailUrl, name: item.name })}
                      className="relative w-16 h-16 bg-dark-700 rounded-xl overflow-hidden flex-shrink-0 border border-dark-600 group cursor-pointer hover:border-gold-500/50 transition-all"
                      disabled={!item.thumbnailUrl}
                    >
                      {item.thumbnailUrl ? (
                        <>
                          <Image
                            src={item.thumbnailUrl}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                          {/* Hover overlay with zoom icon */}
                          <div className="absolute inset-0 bg-dark-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn className="w-5 h-5 text-gold-400" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gold-400">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate text-dark-100">{item.name}</h3>
                      <p className="text-xs text-dark-500 capitalize">
                        {item.jewelryType}
                      </p>
                      <p className="text-xs text-dark-500">x{item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-gold-400">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              {/* Totals */}
              <div className="space-y-2 pt-4 border-t border-dark-700">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">{tCart("subtotal")}</span>
                  <span className="text-dark-200">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">{tCart("shipping")}</span>
                  <span className="text-gold-400">{shippingCost === 0 ? t("freeShipping") : formatPrice(shippingCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">{tCart("tax")} (17%)</span>
                  <span className="text-dark-200">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 mt-2 border-t border-dark-600">
                  <span className="text-dark-100">{tCart("total")}</span>
                  <span className="text-gradient-gold-bright">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/90 backdrop-blur-sm animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-lg w-full bg-dark-800 rounded-2xl overflow-hidden border border-dark-700 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 z-10 w-10 h-10 bg-dark-900/80 hover:bg-dark-900 text-dark-300 hover:text-white rounded-full flex items-center justify-center transition-all"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Image */}
            <div className="aspect-square relative">
              <Image
                src={previewImage.url}
                alt={previewImage.name}
                fill
                className="object-contain"
                sizes="(max-width: 512px) 100vw, 512px"
              />
            </div>

            {/* Image name */}
            <div className="p-4 border-t border-dark-700">
              <h3 className="text-center font-medium text-dark-100">{previewImage.name}</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
