import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, localeDirections, type Locale } from "@/lib/i18n/config";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { CartProvider } from "@/contexts/CartContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CartDrawer } from "@/components/cart/CartDrawer";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();
  const direction = localeDirections[locale as Locale];

  return (
    <html lang={locale} dir={direction} className="theme-warm">
      <head>
        {/* Hebrew font for RTL support */}
        {locale === "he" && (
          <link
            href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;500;600;700&family=Heebo:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        )}
      </head>
      <body className="antialiased min-h-screen bg-bg-primary text-text-primary">
        <ThemeProvider>
          <AuthProvider>
            <NextIntlClientProvider messages={messages}>
              <CartProvider>
                {children}
                <CartDrawer />
              </CartProvider>
            </NextIntlClientProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
