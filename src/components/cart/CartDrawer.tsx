"use client";

import { useCart } from "@/contexts/CartContext";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
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
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => setCartOpen(false)}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 ${
          locale === "he" ? "left-0" : "right-0"
        } h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-xl z-50 flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            {t("title")} ({totalItems})
          </h2>
          <button
            onClick={() => setCartOpen(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">{t("empty")}</p>
              <Link
                href={`/${locale}/design`}
                onClick={() => setCartOpen(false)}
                className="mt-4 inline-block text-amber-600 hover:text-amber-700 font-medium"
              >
                {t("startDesigning")}
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                    {item.thumbnailUrl ? (
                      <Image
                        src={item.thumbnailUrl}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{item.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {item.jewelryType} - {item.material.replace("_", " ")}
                    </p>
                    {item.size && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("size")}: {item.size}
                      </p>
                    )}
                    <p className="font-semibold text-amber-600 mt-1">
                      {formatPrice(item.price)}
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 ms-auto"
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
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
            <div className="flex justify-between text-lg font-semibold">
              <span>{t("subtotal")}</span>
              <span className="text-amber-600">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("shippingNote")}
            </p>
            <Link
              href={`/${locale}/checkout`}
              onClick={() => setCartOpen(false)}
              className="block w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white text-center font-semibold rounded-lg transition-colors"
            >
              {t("checkout")}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
