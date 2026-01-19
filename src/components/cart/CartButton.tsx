"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

export function CartButton() {
  const { toggleCart, totalItems } = useCart();

  return (
    <button
      onClick={toggleCart}
      className="relative p-2.5 hover:bg-dark-700 rounded-xl transition-all group"
      aria-label="Shopping cart"
    >
      <ShoppingCart className="w-5 h-5 text-dark-300 group-hover:text-gold-400 transition-colors" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-gold-500 to-gold-400 text-dark-900 text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-gold-500/30">
          {totalItems > 9 ? "9+" : totalItems}
        </span>
      )}
    </button>
  );
}
