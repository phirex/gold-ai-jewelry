"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Gem, Facebook, Instagram, Twitter, Sparkles, Heart } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const t = useTranslations("footer");
  const tCommon = useTranslations("common");
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { href: "/about", label: t("about") },
      { href: "/contact", label: t("contact") },
      { href: "/faq", label: t("faq") },
    ],
    legal: [
      { href: "/terms", label: t("terms") },
      { href: "/privacy", label: t("privacy") },
      { href: "/shipping", label: t("shipping") },
    ],
  };

  const socialLinks = [
    { href: "https://facebook.com", icon: Facebook, label: t("socialFacebook") },
    { href: "https://instagram.com", icon: Instagram, label: t("socialInstagram") },
    { href: "https://twitter.com", icon: Twitter, label: t("socialTwitter") },
  ];

  return (
    <footer
      className={cn(
        "relative border-t border-border bg-bg-secondary overflow-hidden",
        className
      )}
    >
      {/* Decorative gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-primary/40 to-transparent" />

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-accent-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-accent-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-bold text-xl mb-6 group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-accent-primary/20 rounded-full blur-md group-hover:bg-accent-primary/30 transition-all" />
                <Gem className="relative h-7 w-7 text-accent-primary group-hover:scale-110 transition-transform" />
                <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-accent-tertiary animate-pulse" />
              </div>
              <span className="font-display text-2xl text-text-primary">
                {tCommon("appName")}
              </span>
            </Link>
            <p className="text-sm text-text-secondary max-w-md mb-8 leading-relaxed">
              {t("description")}
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "p-3 rounded-xl",
                    "bg-bg-tertiary border border-border",
                    "hover:border-accent-tertiary hover:bg-bg-accent",
                    "text-text-tertiary hover:text-accent-primary",
                    "transition-all duration-300 group",
                    "hover:shadow-soft"
                  )}
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-text-primary mb-6 text-sm uppercase tracking-wide">
              {t("company")}
            </h3>
            <ul className="space-y-4">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-tertiary hover:text-accent-primary transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-0 h-0.5 bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-300 group-hover:w-3 rounded-full" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-text-primary mb-6 text-sm uppercase tracking-wide">
              {t("legal")}
            </h3>
            <ul className="space-y-4">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-tertiary hover:text-accent-primary transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-0 h-0.5 bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-300 group-hover:w-3 rounded-full" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-tertiary">
            {t("copyright", { year: currentYear })}
          </p>
          <p className="text-sm text-text-tertiary flex items-center gap-1.5">
            Made with <Heart className="h-4 w-4 text-accent-secondary fill-accent-secondary animate-pulse" /> using AI
          </p>
        </div>
      </div>
    </footer>
  );
}
