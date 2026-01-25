"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils/cn";

interface MetalPrices {
  gold_24k: number;
  gold_18k: number;
  gold_14k: number;
  silver: number;
  platinum: number;
}

interface MarketData {
  prices: MetalPrices;
  metadata: {
    source: "live" | "cached" | "fallback";
    timestamp: string;
    isFresh: boolean;
    remainingTtlSeconds: number;
  };
}

const METALS = [
  { key: "gold_24k", label: "Gold 24K", color: "from-yellow-300 to-yellow-500" },
  { key: "gold_18k", label: "Gold 18K", color: "from-yellow-400 to-yellow-600" },
  { key: "gold_14k", label: "Gold 14K", color: "from-yellow-500 to-yellow-700" },
  { key: "silver", label: "Silver", color: "from-gray-300 to-gray-500" },
  { key: "platinum", label: "Platinum", color: "from-gray-200 to-gray-400" },
] as const;

export function MarketDataCard() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>("");

  const fetchMarketData = async () => {
    try {
      const response = await fetch("/api/pricing/metals");
      const data = await response.json();
      
      if (data.success) {
        setMarketData(data);
        setError(null);
      } else {
        setError(data.error || "Failed to fetch prices");
      }
    } catch {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Update time since last update
  useEffect(() => {
    if (!marketData?.metadata.timestamp) return;

    const updateTimeSince = () => {
      const timestamp = new Date(marketData.metadata.timestamp);
      const now = new Date();
      const diffMs = now.getTime() - timestamp.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) {
        setTimeSinceUpdate("just now");
      } else if (diffMins < 60) {
        setTimeSinceUpdate(`${diffMins}m ago`);
      } else {
        const diffHours = Math.floor(diffMins / 60);
        setTimeSinceUpdate(`${diffHours}h ago`);
      }
    };

    updateTimeSince();
    const interval = setInterval(updateTimeSince, 60000);
    return () => clearInterval(interval);
  }, [marketData?.metadata.timestamp]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getStatusConfig = (source: string, isFresh: boolean) => {
    if (source === "live" || (source === "cached" && isFresh)) {
      return {
        color: "bg-green-500",
        label: "Live",
        description: "Real-time market prices",
      };
    }
    if (source === "cached") {
      return {
        color: "bg-yellow-500",
        label: "Cached",
        description: "Using recently cached prices",
      };
    }
    return {
      color: "bg-orange-500",
      label: "Offline",
      description: "Using fallback prices",
    };
  };

  if (isLoading) {
    return (
      <div className="bg-dark-800 rounded-2xl border border-dark-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-dark-700 rounded w-1/2" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-dark-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !marketData) {
    return (
      <div className="bg-dark-800 rounded-2xl border border-dark-700 p-6">
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-dark-400 text-sm">{error || "Unable to load market data"}</p>
          <button
            onClick={fetchMarketData}
            className="mt-4 text-sm text-gold-500 hover:text-gold-400 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const status = getStatusConfig(marketData.metadata.source, marketData.metadata.isFresh);

  return (
    <div className="bg-dark-800 rounded-2xl border border-dark-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Market Prices
        </h2>
        
        {/* Status Indicator */}
        <div className="flex items-center gap-2" title={status.description}>
          <span className={cn("w-2 h-2 rounded-full animate-pulse", status.color)} />
          <span className="text-xs text-dark-400">{status.label}</span>
        </div>
      </div>

      {/* Metal Prices */}
      <div className="space-y-3">
        {METALS.map((metal) => {
          const price = marketData.prices[metal.key as keyof MetalPrices];
          return (
            <div
              key={metal.key}
              className="flex items-center justify-between p-3 rounded-lg bg-dark-700/50 hover:bg-dark-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  "w-3 h-3 rounded-full bg-gradient-to-br",
                  metal.color
                )} />
                <span className="text-dark-300 text-sm font-medium">{metal.label}</span>
              </div>
              <span className="text-white font-mono text-sm">
                {formatPrice(price)}/g
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-dark-700 flex items-center justify-between text-xs text-dark-500">
        <span>Updated {timeSinceUpdate}</span>
        <button
          onClick={fetchMarketData}
          className="flex items-center gap-1 text-gold-500 hover:text-gold-400 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* TTL indicator */}
      {marketData.metadata.remainingTtlSeconds > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-dark-500 mb-1">
            <span>Cache expires in</span>
            <span>{Math.ceil(marketData.metadata.remainingTtlSeconds / 60)} min</span>
          </div>
          <div className="h-1 bg-dark-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-1000"
              style={{
                width: `${(marketData.metadata.remainingTtlSeconds / 3600) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
