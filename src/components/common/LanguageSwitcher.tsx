"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { locales, localeNames, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils/cn";

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;

    // Get the path without the current locale
    const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";

    // Navigate to the new locale path
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  return (
    <div className={cn("flex items-center gap-1 bg-dark-800 rounded-lg p-1", className)}>
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
            locale === loc
              ? "bg-gold-500 text-dark-900"
              : "text-dark-300 hover:text-gold-400 hover:bg-dark-700"
          )}
          aria-label={`Switch to ${localeNames[loc]}`}
        >
          {loc === "en" ? "EN" : "עב"}
        </button>
      ))}
    </div>
  );
}
