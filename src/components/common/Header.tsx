"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Menu, X, User, Gem, Sparkles } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
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
        "sticky top-0 z-50 w-full border-b border-gold-500/10 bg-dark-900/80 backdrop-blur-xl",
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
              <div className="absolute inset-0 bg-gold-400/20 rounded-full blur-md group-hover:bg-gold-400/30 transition-all" />
              <Gem className="relative h-7 w-7 text-gold-400 group-hover:scale-110 transition-transform" />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-gold-300 animate-pulse" />
            </div>
            <span className="hidden sm:inline text-gradient-gold-bright">{tCommon("appName")}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-dark-200 hover:text-gold-400 transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-gold-400 to-gold-500 transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />

            <CartButton />

            <Link
              href="/account"
              className="p-2.5 hover:bg-dark-700 rounded-xl transition-all duration-200 group"
              aria-label={t("account")}
            >
              <User className="h-5 w-5 text-dark-300 group-hover:text-gold-400 transition-colors" />
            </Link>

            <Link href="/design">
              <Button variant="gradient" size="sm">{tCommon("startDesigning")}</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2.5 hover:bg-dark-700 rounded-xl transition-all duration-200"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? t("closeMenu") : t("openMenu")}
          >
            <div className="relative w-6 h-6">
              <Menu className={cn(
                "absolute inset-0 h-6 w-6 text-dark-200 transition-all duration-300",
                mobileMenuOpen ? "opacity-0 rotate-90" : "opacity-100 rotate-0"
              )} />
              <X className={cn(
                "absolute inset-0 h-6 w-6 text-dark-200 transition-all duration-300",
                mobileMenuOpen ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"
              )} />
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
          mobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="py-4 border-t border-gold-500/10">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-3 text-sm font-medium text-dark-200 hover:text-gold-400 hover:bg-dark-800 rounded-xl transition-all duration-200",
                    mobileMenuOpen && "animate-fade-in-up",
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              <div className="border-t border-gold-500/10 my-2" />

              <div
                className="px-4 py-3 text-sm font-medium text-dark-200 hover:bg-dark-800 rounded-xl transition-all duration-200 flex items-center gap-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                <CartButton />
                <span>{t("cart")}</span>
              </div>

              <Link
                href="/account"
                className="px-4 py-3 text-sm font-medium text-dark-200 hover:text-gold-400 hover:bg-dark-800 rounded-xl transition-all duration-200 flex items-center gap-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="h-4 w-4" />
                {t("account")}
              </Link>

              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-dark-400">{t("language")}</span>
                <LanguageSwitcher />
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
