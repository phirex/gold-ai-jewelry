"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Gem, Facebook, Instagram, Twitter, Sparkles } from "lucide-react";
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
        "border-t border-gold-500/10 bg-dark-950",
        className
      )}
    >
      {/* Subtle glow at top */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-bold text-xl mb-6 group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gold-400/20 rounded-full blur-md group-hover:bg-gold-400/30 transition-all" />
                <Gem className="relative h-7 w-7 text-gold-400 group-hover:scale-110 transition-transform" />
                <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-gold-300 animate-pulse" />
              </div>
              <span className="text-gradient-gold-bright">{tCommon("appName")}</span>
            </Link>
            <p className="text-sm text-dark-300 max-w-md mb-8 leading-relaxed">
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
                  className="p-3 rounded-xl bg-dark-800 border border-dark-700 hover:border-gold-500/50 hover:bg-dark-700 text-dark-400 hover:text-gold-400 transition-all duration-300 group"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-dark-100 mb-6">{t("company")}</h3>
            <ul className="space-y-4">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-dark-400 hover:text-gold-400 transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-0 h-0.5 bg-gradient-to-r from-gold-400 to-gold-500 transition-all duration-300 group-hover:w-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-dark-100 mb-6">{t("legal")}</h3>
            <ul className="space-y-4">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-dark-400 hover:text-gold-400 transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-0 h-0.5 bg-gradient-to-r from-gold-400 to-gold-500 transition-all duration-300 group-hover:w-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-dark-800 mt-12 pt-8 text-center">
          <p className="text-sm text-dark-500">
            {t("copyright", { year: currentYear })}
          </p>
        </div>
      </div>
    </footer>
  );
}
