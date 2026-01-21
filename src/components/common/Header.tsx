"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Menu, X, User, Gem, Sparkles } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { CartButton } from "@/components/cart/CartButton";
import { Button } from "@/components/ui/Button";
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
        "bg-bg-primary/80 backdrop-blur-xl",
        "border-b border-border",
        "shadow-sm",
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-xl group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-accent-primary/20 rounded-full blur-md group-hover:bg-accent-primary/30 transition-all" />
              <Gem className="relative h-7 w-7 text-accent-primary group-hover:scale-110 transition-transform" />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-accent-tertiary animate-pulse" />
            </div>
            <span className="hidden sm:inline font-display text-2xl text-text-primary">
              {tCommon("appName")}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-text-secondary hover:text-accent-primary transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-300 group-hover:w-full rounded-full" />
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeSwitcher />

            <LanguageSwitcher />

            <CartButton />

            <Link
              href="/account"
              className="p-2.5 hover:bg-bg-secondary rounded-xl transition-all duration-200 group"
              aria-label={t("account")}
            >
              <User className="h-5 w-5 text-text-tertiary group-hover:text-accent-primary transition-colors" />
            </Link>

            <Link href="/design">
              <Button variant="gradient" size="sm">{tCommon("startDesigning")}</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2.5 hover:bg-bg-secondary rounded-xl transition-all duration-200"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? t("closeMenu") : t("openMenu")}
          >
            <div className="relative w-6 h-6">
              <Menu className={cn(
                "absolute inset-0 h-6 w-6 text-text-secondary transition-all duration-300",
                mobileMenuOpen ? "opacity-0 rotate-90" : "opacity-100 rotate-0"
              )} />
              <X className={cn(
                "absolute inset-0 h-6 w-6 text-text-secondary transition-all duration-300",
                mobileMenuOpen ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"
              )} />
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
          mobileMenuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="py-4 border-t border-border">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-3 text-sm font-medium text-text-secondary hover:text-accent-primary hover:bg-bg-secondary rounded-xl transition-all duration-200",
                    mobileMenuOpen && "animate-fade-in-up",
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              <div className="border-t border-border my-2" />

              <div
                className="px-4 py-3 text-sm font-medium text-text-secondary hover:bg-bg-secondary rounded-xl transition-all duration-200 flex items-center gap-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                <CartButton />
                <span>{t("cart")}</span>
              </div>

              <Link
                href="/account"
                className="px-4 py-3 text-sm font-medium text-text-secondary hover:text-accent-primary hover:bg-bg-secondary rounded-xl transition-all duration-200 flex items-center gap-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="h-4 w-4" />
                {t("account")}
              </Link>

              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-text-tertiary">{t("language")}</span>
                <LanguageSwitcher />
              </div>

              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-text-tertiary">Theme</span>
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
