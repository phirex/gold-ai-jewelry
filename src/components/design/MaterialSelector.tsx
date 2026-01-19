"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";

export type Material = "gold_14k" | "gold_18k" | "gold_24k" | "silver" | "platinum";

interface MaterialSelectorProps {
  value: Material;
  onChange: (material: Material) => void;
  className?: string;
}

const materialColors: Record<Material, string> = {
  gold_14k: "bg-gradient-to-br from-yellow-500 to-yellow-700",
  gold_18k: "bg-gradient-to-br from-yellow-400 to-yellow-600",
  gold_24k: "bg-gradient-to-br from-yellow-300 to-yellow-500",
  silver: "bg-gradient-to-br from-gray-400 to-gray-500",
  platinum: "bg-gradient-to-br from-gray-300 to-gray-400",
};

export function MaterialSelector({
  value,
  onChange,
  className,
}: MaterialSelectorProps) {
  const t = useTranslations("design.studio.materials");

  const materials: { value: Material; label: string }[] = [
    { value: "gold_14k", label: t("gold14k") },
    { value: "gold_18k", label: t("gold18k") },
    { value: "gold_24k", label: t("gold24k") },
    { value: "silver", label: t("silver") },
    { value: "platinum", label: t("platinum") },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="font-medium text-sm text-dark-100">{t("title")}</h3>
      <div className="flex flex-wrap gap-2">
        {materials.map((material) => (
          <button
            key={material.value}
            onClick={() => onChange(material.value)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm",
              value === material.value
                ? "border-gold-500 bg-gold-500/10 text-gold-400"
                : "border-dark-600 bg-dark-700 text-dark-300 hover:border-gold-500/50 hover:text-dark-100"
            )}
          >
            <span
              className={cn(
                "w-4 h-4 rounded-full shadow-sm",
                materialColors[material.value]
              )}
            />
            <span>{material.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
