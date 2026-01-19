"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";

interface PriceBreakdown {
  materials: number;
  stones: number;
  labor: number;
  total: number;
}

interface PriceDisplayProps {
  breakdown?: PriceBreakdown | null;
  currency?: string;
  isLoading?: boolean;
  className?: string;
}

export function PriceDisplay({
  breakdown,
  currency = "ILS",
  isLoading = false,
  className,
}: PriceDisplayProps) {
  const t = useTranslations("design.pricing");

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <h3 className="font-semibold text-lg text-dark-100">{t("title")}</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-6 bg-dark-700 rounded-lg animate-pulse"
              style={{ width: `${60 + i * 10}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!breakdown) {
    return (
      <div className={cn("space-y-4", className)}>
        <h3 className="font-semibold text-lg text-dark-100">{t("title")}</h3>
        <div className="p-4 rounded-xl bg-dark-800 border border-dark-700 text-center">
          <p className="text-sm text-dark-400">
            {t("generatePrompt")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="font-semibold text-lg text-dark-100">{t("title")}</h3>

      <div className="space-y-3 text-sm p-4 rounded-xl bg-dark-800 border border-dark-700">
        <div className="flex justify-between">
          <span className="text-dark-400">{t("materials")}</span>
          <span className="font-medium text-dark-200">{formatPrice(breakdown.materials)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-dark-400">{t("stones")}</span>
          <span className="font-medium text-dark-200">{formatPrice(breakdown.stones)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-dark-400">{t("labor")}</span>
          <span className="font-medium text-dark-200">{formatPrice(breakdown.labor)}</span>
        </div>

        <div className="border-t border-dark-600 pt-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-base text-dark-100">{t("total")}</span>
            <span className="text-gradient-gold-bright font-bold text-xl">{formatPrice(breakdown.total)}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-dark-500">{t("note")}</p>
    </div>
  );
}
