"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "link" | "gradient";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const t = useTranslations("common");
    const { theme } = useTheme();
    const isApple = theme === "minimal";

    // Base styles - Apple uses more rounded buttons and different transitions
    const baseStyles = cn(
      "inline-flex items-center justify-center font-medium transition-all",
      "focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
      isApple 
        ? "rounded-full duration-200 focus-visible:ring-4 focus-visible:ring-[#0071E3]/30" 
        : "rounded-xl duration-300 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary press-effect"
    );

    // Variants with Apple-specific overrides
    const variants = {
      primary: isApple
        ? "bg-[#1D1D1F] text-white hover:bg-[#3A3A3C] active:scale-[0.98] active:opacity-90"
        : "bg-accent-primary text-text-inverse hover:opacity-90 shadow-md hover:shadow-lg",
      secondary: isApple
        ? "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#EFEFEF] active:scale-[0.98]"
        : "bg-bg-tertiary text-text-primary hover:bg-bg-accent border border-border hover:border-accent-tertiary",
      outline: isApple
        ? "border border-[#1D1D1F] text-[#1D1D1F] hover:bg-[#1D1D1F]/5 active:scale-[0.98]"
        : "border-2 border-accent-primary text-accent-primary hover:bg-accent-primary/10",
      ghost: isApple
        ? "text-[#0071E3] hover:bg-[#0071E3]/10 active:scale-[0.98]"
        : "text-text-secondary hover:text-accent-primary hover:bg-bg-secondary",
      link: isApple
        ? "text-[#0071E3] hover:underline underline-offset-2"
        : "text-accent-primary underline-offset-4 hover:underline hover:opacity-80",
      gradient: isApple
        ? "bg-[#1D1D1F] text-white hover:bg-[#3A3A3C] active:scale-[0.98] active:opacity-90 shadow-sm hover:shadow-md"
        : "bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 bg-[length:200%_100%] text-text-inverse font-bold shadow-lg shadow-accent hover:shadow-xl hover:bg-[position:100%_0] transition-all duration-500",
    };

    // Sizes with Apple-specific adjustments
    const sizes = {
      sm: isApple ? "h-8 px-4 text-sm tracking-[-0.01em]" : "h-9 px-4 text-sm",
      md: isApple ? "h-11 px-6 text-[15px] tracking-[-0.01em]" : "h-11 px-6 text-base",
      lg: isApple ? "h-[50px] px-8 text-[17px] tracking-[-0.01em]" : "h-14 px-8 text-lg",
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className={cn(
                "h-4 w-4 animate-spin",
                isApple ? "mr-2 rtl:mr-0 rtl:ml-2" : "mr-2 rtl:mr-0 rtl:ml-2"
              )}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {t("loading")}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
