"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import type { PricingBreakdown } from "@/lib/pricing/calculator";

// Legacy breakdown format for backward compatibility
interface LegacyPriceBreakdown {
  materials: number;
  stones: number;
  labor: number;
  total: number;
}

interface PriceDisplayProps {
  breakdown?: PricingBreakdown | LegacyPriceBreakdown | null;
  currency?: string;
  isLoading?: boolean;
  className?: string;
  compact?: boolean;
  showMarketIndicator?: boolean;
}

// Type guard to check if breakdown is advanced
function isAdvancedBreakdown(
  breakdown: PricingBreakdown | LegacyPriceBreakdown
): breakdown is PricingBreakdown {
  return "metadata" in breakdown;
}

export function PriceDisplay({
  breakdown,
  currency = "ILS",
  isLoading = false,
  className,
  compact = false,
  showMarketIndicator = true,
}: PriceDisplayProps) {
  const t = useTranslations("design.pricing");
  const [isExpanded, setIsExpanded] = useState(false);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Loading state
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

  // Empty state
  if (!breakdown) {
    return (
      <div className={cn("space-y-4", className)}>
        <h3 className="font-semibold text-lg text-dark-100">{t("title")}</h3>
        <div className="p-4 rounded-xl bg-dark-800 border border-dark-700 text-center">
          <p className="text-sm text-dark-400">{t("generatePrompt")}</p>
        </div>
      </div>
    );
  }

  const isAdvanced = isAdvancedBreakdown(breakdown);

  // Compact view for mobile or sidebar
  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-dark-400">{t("estimatedPrice")}</span>
          {showMarketIndicator && isAdvanced && (
            <MarketIndicator source={breakdown.metadata.metalPricesSource} />
          )}
        </div>
        <div className="text-gradient-gold-bright font-bold text-2xl">
          {isAdvanced && breakdown.priceRange.low !== breakdown.priceRange.high ? (
            <>
              {formatPrice(breakdown.priceRange.low)} - {formatPrice(breakdown.priceRange.high)}
            </>
          ) : (
            formatPrice(breakdown.total)
          )}
        </div>
      </div>
    );
  }

  // Full detailed view
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-dark-100">{t("title")}</h3>
        {showMarketIndicator && isAdvanced && (
          <MarketIndicator source={breakdown.metadata.metalPricesSource} />
        )}
      </div>

      <div className="space-y-3 text-sm p-4 rounded-xl bg-dark-800 border border-dark-700">
        {/* Materials */}
        <div className="flex justify-between">
          <span className="text-dark-400">{t("materials")}</span>
          <span className="font-medium text-dark-200">
            {formatPrice(isAdvanced ? breakdown.materials.subtotal : breakdown.materials)}
          </span>
        </div>

        {/* Material details (advanced only) */}
        {isAdvanced && isExpanded && (
          <div className="pl-4 space-y-1 text-xs border-l-2 border-dark-600">
            <div className="flex justify-between text-dark-500">
              <span>{t("weight")}</span>
              <span>{breakdown.materials.weightGrams}g</span>
            </div>
            <div className="flex justify-between text-dark-500">
              <span>{t("pricePerGram")}</span>
              <span>{formatPrice(breakdown.materials.pricePerGram)}/g</span>
            </div>
          </div>
        )}

        {/* Stones */}
        <div className="flex justify-between">
          <span className="text-dark-400">{t("stones")}</span>
          <span className="font-medium text-dark-200">
            {formatPrice(isAdvanced ? breakdown.stones.subtotal : breakdown.stones)}
          </span>
        </div>

        {/* Stone details (advanced only) */}
        {isAdvanced && isExpanded && breakdown.stones.items.length > 0 && (
          <div className="pl-4 space-y-1 text-xs border-l-2 border-dark-600">
            {breakdown.stones.items.map((stone, idx) => (
              <div key={idx} className="flex justify-between text-dark-500">
                <span>
                  {stone.quantity}x {stone.type}
                </span>
                <span>{formatPrice(stone.total)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Labor */}
        <div className="flex justify-between">
          <span className="text-dark-400">{t("labor")}</span>
          <span className="font-medium text-dark-200">
            {formatPrice(isAdvanced ? breakdown.labor.subtotal : breakdown.labor)}
          </span>
        </div>

        {/* Labor details (advanced only) */}
        {isAdvanced && isExpanded && (
          <div className="pl-4 space-y-1 text-xs border-l-2 border-dark-600">
            <div className="flex justify-between text-dark-500">
              <span>{t("complexity")}</span>
              <span className="capitalize">{breakdown.labor.complexity}</span>
            </div>
            <div className="flex justify-between text-dark-500">
              <span>{t("estimatedHours")}</span>
              <span>{breakdown.labor.hours}h</span>
            </div>
            {breakdown.labor.confidence && (
              <div className="flex justify-between text-dark-500">
                <span>{t("confidence")}</span>
                <span>{Math.round(breakdown.labor.confidence * 100)}%</span>
              </div>
            )}
          </div>
        )}

        {/* Overhead (advanced only) */}
        {isAdvanced && isExpanded && (
          <div className="flex justify-between">
            <span className="text-dark-400">{t("overhead")}</span>
            <span className="font-medium text-dark-200">
              {formatPrice(breakdown.overhead.subtotal)}
            </span>
          </div>
        )}

        {/* Expand/collapse button */}
        {isAdvanced && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-center text-xs text-gold-500 hover:text-gold-400 transition-colors py-1"
          >
            {isExpanded ? t("showLess") : t("showDetails")}
          </button>
        )}

        {/* Total */}
        <div className="border-t border-dark-600 pt-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-base text-dark-100">{t("total")}</span>
            <div className="text-right">
              <span className="text-gradient-gold-bright font-bold text-xl">
                {formatPrice(breakdown.total)}
              </span>
              {/* Price range (advanced only) */}
              {isAdvanced &&
                breakdown.priceRange.low !== breakdown.priceRange.high && (
                  <div className="text-xs text-dark-500 mt-0.5">
                    {formatPrice(breakdown.priceRange.low)} -{" "}
                    {formatPrice(breakdown.priceRange.high)}
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Timestamp and source info */}
      {isAdvanced && (
        <div className="flex items-center justify-between text-xs text-dark-500">
          <span>{t("note")}</span>
          <span>
            {t("lastUpdated")}: {new Date(breakdown.metadata.calculatedAt).toLocaleTimeString()}
          </span>
        </div>
      )}

      {!isAdvanced && <p className="text-xs text-dark-500">{t("note")}</p>}
    </div>
  );
}

/**
 * Market price indicator component
 */
function MarketIndicator({ source }: { source: "live" | "cached" | "fallback" }) {
  const t = useTranslations("design.pricing.market");

  const config = {
    live: {
      color: "bg-green-500",
      label: t("live"),
      tooltip: t("livePrices"),
    },
    cached: {
      color: "bg-yellow-500",
      label: t("cached"),
      tooltip: t("cachedPrices"),
    },
    fallback: {
      color: "bg-orange-500",
      label: t("offline"),
      tooltip: t("fallbackPrices"),
    },
  };

  const { color, label, tooltip } = config[source];

  return (
    <div
      className="flex items-center gap-1.5 text-xs text-dark-400 cursor-help"
      title={tooltip}
    >
      <span className={cn("w-2 h-2 rounded-full animate-pulse", color)} />
      <span>{label}</span>
    </div>
  );
}

/**
 * Standalone market prices display
 */
export function MarketPricesDisplay({
  prices,
  className,
}: {
  prices?: {
    gold_24k: number;
    gold_18k: number;
    gold_14k: number;
    silver: number;
    platinum: number;
  };
  className?: string;
}) {
  const t = useTranslations("design.pricing.metals");

  if (!prices) {
    return null;
  }

  const metals = [
    { key: "gold_24k", label: t("gold24k"), price: prices.gold_24k },
    { key: "gold_18k", label: t("gold18k"), price: prices.gold_18k },
    { key: "gold_14k", label: t("gold14k"), price: prices.gold_14k },
    { key: "silver", label: t("silver"), price: prices.silver },
    { key: "platinum", label: t("platinum"), price: prices.platinum },
  ];

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  return (
    <div className={cn("text-xs", className)}>
      <div className="font-medium text-dark-300 mb-2">{t("title")}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {metals.map((metal) => (
          <div key={metal.key} className="flex justify-between">
            <span className="text-dark-500">{metal.label}</span>
            <span className="text-dark-400 font-mono">
              {formatPrice(metal.price)}/g
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
