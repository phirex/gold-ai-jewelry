"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Menu, X, User, Gem, Sparkles } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { CartButton } from "@/components/cart/CartButton";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils/cn";
import { isRTL, type Locale } from "@/lib/i18n/config";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const locale = useLocale() as Locale;
  const rtl = isRTL(locale);
  const { theme } = useTheme();
  const isApple = theme === "minimal";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/design", label: t("design") },
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full",
        isApple 
          ? "bg-[#FBFBFD]/72 backdrop-blur-[20px] backdrop-saturate-[180%] border-b border-[#D2D2D7]/50"
          : "bg-bg-primary/80 backdrop-blur-xl border-b border-border shadow-sm",
        className
      )}
    >
      <div className={cn("container mx-auto", isApple ? "px-6" : "px-4")}>
        <div className={cn("flex items-center justify-between", isApple ? "h-12" : "h-16")}>
          {/* Logo */}
          <Link
            href="/"
            className={cn(
              "flex items-center font-bold text-xl group",
              isApple ? "gap-2" : "gap-2.5"
            )}
          >
            {isApple ? (
              // Modern logo with gold sparkle accent
              <>
                <div className="relative">
                  <Gem className="h-6 w-6 text-[#1D1D1F] group-hover:scale-105 transition-transform" />
                  <Sparkles className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 text-[#D4A574] animate-pulse" />
                </div>
                <span className="hidden sm:inline text-[17px] font-semibold text-[#1D1D1F] tracking-[-0.02em]">
                  {tCommon("appName")}
                </span>
              </>
            ) : (
              // Classic gold decorative logo
              <>
                <div className="relative">
                  <div className="absolute inset-0 bg-accent-primary/20 rounded-full blur-md group-hover:bg-accent-primary/30 transition-all" />
                  <Gem className="relative h-7 w-7 text-accent-primary group-hover:scale-110 transition-transform" />
                  <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-accent-tertiary animate-pulse" />
                </div>
                <span className="hidden sm:inline font-display text-2xl text-text-primary">
                  {tCommon("appName")}
                </span>
              </>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className={cn("hidden md:flex items-center", isApple ? "gap-7" : "gap-8")}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "font-medium transition-colors relative group",
                  isApple 
                    ? "text-xs text-[#1D1D1F]/80 hover:text-[#1D1D1F] tracking-[-0.008em]"
                    : "text-sm text-text-secondary hover:text-accent-primary"
                )}
              >
                {link.label}
                {!isApple && (
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-300 group-hover:w-full rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className={cn("hidden md:flex items-center", isApple ? "gap-4" : "gap-3")}>
            <ThemeSwitcher />

            <LanguageSwitcher />

            <CartButton />

            <Link
              href="/account"
              className={cn(
                "transition-all duration-200 group",
                isApple 
                  ? "p-2 hover:bg-[#1D1D1F]/5 rounded-full"
                  : "p-2.5 hover:bg-bg-secondary rounded-xl"
              )}
              aria-label={t("account")}
            >
              <User className={cn(
                "h-5 w-5 transition-colors",
                isApple 
                  ? "text-[#1D1D1F]/60 group-hover:text-[#1D1D1F]"
                  : "text-text-tertiary group-hover:text-accent-primary"
              )} />
            </Link>

            <Link href="/design">
              <Button variant="gradient" size="sm">{tCommon("startDesigning")}</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={cn(
              "md:hidden transition-all duration-200",
              isApple
                ? "p-2 hover:bg-[#1D1D1F]/5 rounded-full"
                : "p-2.5 hover:bg-bg-secondary rounded-xl"
            )}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? t("closeMenu") : t("openMenu")}
          >
            <div className="relative w-5 h-5">
              <Menu className={cn(
                "absolute inset-0 h-5 w-5 transition-all duration-200",
                isApple ? "text-[#1D1D1F]" : "text-text-secondary",
                mobileMenuOpen ? "opacity-0 rotate-90" : "opacity-100 rotate-0"
              )} />
              <X className={cn(
                "absolute inset-0 h-5 w-5 transition-all duration-200",
                isApple ? "text-[#1D1D1F]" : "text-text-secondary",
                mobileMenuOpen ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"
              )} />
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={cn(
          "md:hidden overflow-hidden transition-all ease-in-out",
          isApple ? "duration-250" : "duration-300",
          mobileMenuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className={cn(
            "py-4 border-t",
            isApple ? "border-[#D2D2D7]/50" : "border-border"
          )}>
            <nav className="flex flex-col gap-1">
              {navLinks.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-3 font-medium transition-all duration-200",
                    isApple 
                      ? "text-[15px] text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-lg"
                      : "text-sm text-text-secondary hover:text-accent-primary hover:bg-bg-secondary rounded-xl",
                    mobileMenuOpen && "animate-fade-in-up",
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              <div className={cn(
                "border-t my-2",
                isApple ? "border-[#D2D2D7]/50" : "border-border"
              )} />

              <div
                className={cn(
                  "px-4 py-3 font-medium transition-all duration-200 flex items-center gap-3",
                  isApple 
                    ? "text-[15px] text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-lg"
                    : "text-sm text-text-secondary hover:bg-bg-secondary rounded-xl"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <CartButton />
                <span>{t("cart")}</span>
              </div>

              <Link
                href="/account"
                className={cn(
                  "px-4 py-3 font-medium transition-all duration-200 flex items-center gap-3",
                  isApple 
                    ? "text-[15px] text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-lg"
                    : "text-sm text-text-secondary hover:text-accent-primary hover:bg-bg-secondary rounded-xl"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="h-4 w-4" />
                {t("account")}
              </Link>

              <div className="px-4 py-3 flex items-center justify-between">
                <span className={cn(
                  "text-sm",
                  isApple ? "text-[#6E6E73]" : "text-text-tertiary"
                )}>{t("language")}</span>
                <LanguageSwitcher />
              </div>

              <div className="px-4 py-3 flex items-center justify-between">
                <span className={cn(
                  "text-sm",
                  isApple ? "text-[#6E6E73]" : "text-text-tertiary"
                )}>Theme</span>
                <ThemeSwitcher />
              </div>

              <div className="px-4 pt-2">
                <Link href="/design" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="gradient" className="w-full">{tCommon("startDesigning")}</Button>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
