"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { useTranslations } from "next-intl";
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

    const baseStyles =
      "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900 disabled:pointer-events-none disabled:opacity-50";

    const variants = {
      primary:
        "bg-gold-500 text-dark-900 hover:bg-gold-400 shadow-lg shadow-gold-500/20 hover:shadow-gold-400/30 hover:shadow-xl",
      secondary:
        "bg-dark-700 text-dark-100 hover:bg-dark-600 border border-dark-600 hover:border-dark-500",
      outline:
        "border border-gold-500/50 text-gold-400 hover:bg-gold-500/10 hover:border-gold-400",
      ghost:
        "text-dark-200 hover:text-gold-400 hover:bg-dark-800",
      link:
        "text-gold-400 underline-offset-4 hover:underline hover:text-gold-300",
      gradient:
        "bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 bg-[length:200%_100%] text-dark-900 font-bold shadow-lg shadow-gold-500/25 hover:shadow-gold-400/40 hover:shadow-xl hover:bg-[position:100%_0] transition-all duration-500",
    };

    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-11 px-6 text-base",
      lg: "h-14 px-8 text-lg",
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
              className="mr-2 h-4 w-4 animate-spin"
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
