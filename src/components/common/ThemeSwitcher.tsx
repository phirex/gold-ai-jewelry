"use client";

import { useState, useRef, useEffect } from "react";
import { Palette, Check } from "lucide-react";
import { useTheme, Theme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils/cn";

const themeColors: Record<Theme, { primary: string; secondary: string }> = {
  warm: { primary: "#D4A574", secondary: "#F5C7C0" },
  cool: { primary: "#5B9A8B", secondary: "#8B7EC8" },
  bold: { primary: "#FF6B35", secondary: "#7C3AED" },
  minimal: { primary: "#111111", secondary: "#737373" },
};

export function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl",
          "bg-bg-secondary border border-border",
          "hover:border-accent-tertiary hover:shadow-soft",
          "transition-all duration-200",
          "text-text-secondary hover:text-text-primary"
        )}
        aria-label="Change theme"
        aria-expanded={isOpen}
      >
        <Palette className="w-4 h-4" />
        <span className="hidden sm:inline text-sm font-medium">Theme</span>
        <div className="flex gap-0.5">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: themeColors[theme].primary }}
          />
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: themeColors[theme].secondary }}
          />
        </div>
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute top-full right-0 rtl:right-auto rtl:left-0 mt-2 z-50",
            "w-64 p-2 rounded-2xl",
            "bg-bg-primary border border-border",
            "shadow-heavy",
            "animate-fade-in-down"
          )}
        >
          <div className="p-2 mb-2 border-b border-border-light">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
              Choose Theme
            </p>
          </div>
          <div className="space-y-1">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setTheme(t.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl",
                  "transition-all duration-200",
                  theme === t.value
                    ? "bg-bg-accent"
                    : "hover:bg-bg-secondary"
                )}
              >
                {/* Color preview */}
                <div className="flex gap-1">
                  <div
                    className="w-5 h-5 rounded-full shadow-sm"
                    style={{ backgroundColor: themeColors[t.value].primary }}
                  />
                  <div
                    className="w-5 h-5 rounded-full shadow-sm"
                    style={{ backgroundColor: themeColors[t.value].secondary }}
                  />
                </div>

                {/* Label & description */}
                <div className="flex-1 text-left rtl:text-right">
                  <p className="text-sm font-medium text-text-primary">{t.label}</p>
                  <p className="text-xs text-text-tertiary">{t.description}</p>
                </div>

                {/* Check mark for selected */}
                {theme === t.value && (
                  <div className="w-5 h-5 rounded-full bg-accent-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-text-inverse" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
