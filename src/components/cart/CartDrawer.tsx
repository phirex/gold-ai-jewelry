"use client";

import { useCart } from "@/contexts/CartContext";
import { X, Minus, Plus, Trash2, ShoppingBag, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { formatPrice } from "@/lib/pricing/calculator";

export function CartDrawer() {
  const locale = useLocale();
  const t = useTranslations("cart");
  const { items, isOpen, setCartOpen, removeItem, updateQuantity, subtotal, totalItems } =
    useCart();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-dark-900/80 backdrop-blur-sm z-40 animate-fade-in"
        onClick={() => setCartOpen(false)}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 ${
          locale === "he" ? "left-0" : "right-0"
        } h-full w-full max-w-md bg-dark-900 border-s border-dark-700 shadow-2xl z-50 flex flex-col animate-slide-in-right`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-dark-700">
          <h2 className="text-lg font-semibold flex items-center gap-3 text-dark-100">
            <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-gold-400 rounded-xl flex items-center justify-center shadow-lg shadow-gold-500/20">
              <ShoppingBag className="w-5 h-5 text-dark-900" />
            </div>
            {t("title")} ({totalItems})
          </h2>
          <button
            onClick={() => setCartOpen(false)}
            className="p-2.5 hover:bg-dark-800 border border-dark-700 rounded-xl transition-all text-dark-400 hover:text-dark-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-20 h-20 bg-dark-800 border border-gold-500/20 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-10 h-10 text-gold-400" />
                </div>
              </div>
              <p className="text-dark-300 mb-2 font-medium">{t("empty")}</p>
              <p className="text-dark-500 text-sm mb-6">{t("emptySubtitle")}</p>
              <Link
                href={`/${locale}/design`}
                onClick={() => setCartOpen(false)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 text-dark-900 font-semibold rounded-xl transition-all shadow-lg shadow-gold-500/25 hover:shadow-gold-400/40 hover:shadow-xl"
              >
                <Sparkles className="w-4 h-4" />
                {t("startDesigning")}
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-4 p-4 bg-dark-800/50 border border-dark-700 rounded-2xl hover:border-gold-500/30 transition-all"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 bg-dark-700 rounded-xl overflow-hidden flex-shrink-0 border border-dark-600">
                    {item.thumbnailUrl ? (
                      <Image
                        src={item.thumbnailUrl}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gold-400/50">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-gold-400 truncate">{item.name}</h3>
                    <p className="text-xs text-dark-400 capitalize mt-0.5">
                      {item.jewelryType} - {item.material.replace("_", " ")}
                    </p>
                    {item.size && (
                      <p className="text-xs text-dark-500">
                        {t("size")}: {item.size}
                      </p>
                    )}
                    <p className="font-bold text-gradient-gold-bright mt-2">
                      {formatPrice(item.price)}
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1 mt-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded-lg transition-colors text-dark-300 hover:text-gold-400"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center text-sm font-medium text-dark-200">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded-lg transition-colors text-dark-300 hover:text-gold-400"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-8 h-8 flex items-center justify-center ms-auto bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-dark-700 p-5 space-y-4 bg-dark-850">
            <div className="flex justify-between items-center">
              <span className="text-dark-400">{t("subtotal")}</span>
              <span className="text-xl font-bold text-gradient-gold-bright">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-dark-500">
              {t("shippingNote")}
            </p>
            <Link
              href={`/${locale}/checkout`}
              onClick={() => setCartOpen(false)}
              className="block w-full py-3.5 px-4 bg-gradient-to-r from-gold-500 to-gold-400 text-dark-900 text-center font-semibold rounded-xl transition-all shadow-lg shadow-gold-500/25 hover:shadow-gold-400/40 hover:shadow-xl"
            >
              {t("checkout")}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
