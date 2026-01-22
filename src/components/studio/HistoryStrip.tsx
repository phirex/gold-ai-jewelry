"use client";

import { useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Heart, Clock } from "lucide-react";
import { useStudio } from "@/contexts/StudioContext";
import { cn } from "@/lib/utils/cn";

interface HistoryStripProps {
  className?: string;
}

export function HistoryStrip({ className }: HistoryStripProps) {
  const t = useTranslations("studio");
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    imageHistory,
    currentHistoryIndex,
    goToHistoryIndex,
    isFavorite,
  } = useStudio();

  // Auto-scroll to current item when it changes
  useEffect(() => {
    if (scrollRef.current && currentHistoryIndex >= 0) {
      const container = scrollRef.current;
      const items = container.children;
      if (items[currentHistoryIndex]) {
        const item = items[currentHistoryIndex] as HTMLElement;
        const containerWidth = container.offsetWidth;
        const itemLeft = item.offsetLeft;
        const itemWidth = item.offsetWidth;

        // Center the item in the container
        const scrollTo = itemLeft - (containerWidth / 2) + (itemWidth / 2);
        container.scrollTo({ left: scrollTo, behavior: "smooth" });
      }
    }
  }, [currentHistoryIndex]);

  if (imageHistory.length === 0) return null;

  return (
    <div className={cn("glass-card rounded-xl p-3", className)}>
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-4 h-4 text-text-tertiary" />
        <span className="text-xs text-text-tertiary font-medium">
          {t("history.title")}
        </span>
        <span className="text-xs text-text-tertiary">
          ({imageHistory.length})
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {imageHistory.map((url, index) => (
          <button
            key={`${url}-${index}`}
            onClick={() => goToHistoryIndex(index)}
            className={cn(
              "relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all duration-200",
              "border-2",
              index === currentHistoryIndex
                ? "border-accent-primary shadow-glow scale-105"
                : "border-transparent hover:border-accent-tertiary opacity-70 hover:opacity-100"
            )}
          >
            <img
              src={url}
              alt={`History ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Favorite indicator */}
            {isFavorite(url) && (
              <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-accent-secondary flex items-center justify-center">
                <Heart className="w-2.5 h-2.5 text-white fill-current" />
              </div>
            )}
            {/* Index indicator */}
            <div className="absolute bottom-0.5 left-0.5 w-4 h-4 rounded-full bg-bg-primary/80 flex items-center justify-center">
              <span className="text-[10px] font-medium text-text-primary">
                {index + 1}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
