"use client";

import { useTranslations, useLocale } from "next-intl";
import { ChevronLeft, Truck, Clock, Package, RefreshCw, MapPin, Gift } from "lucide-react";
import Link from "next/link";

export default function ShippingPage() {
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const sections = [
    {
      icon: Clock,
      title: locale === "he" ? "זמני ייצור" : "Production Times",
      content: locale === "he" 
        ? "תכשיטים מותאמים אישית מיוצרים בעבודת יד על ידי צורפים מומחים. זמן הייצור הממוצע הוא 2-3 שבועות, תלוי במורכבות העיצוב ובזמינות החומרים."
        : "Custom jewelry is handcrafted by expert jewelers. Average production time is 2-3 weeks, depending on design complexity and material availability."
    },
    {
      icon: Truck,
      title: locale === "he" ? "אפשרויות משלוח" : "Shipping Options",
      content: locale === "he"
        ? "משלוח רגיל: 3-5 ימי עסקים (חינם להזמנות מעל ₪500). משלוח מהיר: 1-2 ימי עסקים (₪50). כל המשלוחים מבוטחים ונשלחים עם מעקב."
        : "Standard shipping: 3-5 business days (free for orders over ₪500). Express shipping: 1-2 business days (₪50). All shipments are insured and tracked."
    },
    {
      icon: Package,
      title: locale === "he" ? "אריזה" : "Packaging",
      content: locale === "he"
        ? "כל תכשיט נשלח באריזת מתנה יוקרתית הכוללת קופסה מהודרת ותעודת אותנטיות. האריזה מתאימה למתנה ומגנה על התכשיט."
        : "Every piece ships in luxury gift packaging including an elegant box and certificate of authenticity. Packaging is gift-ready and protects the jewelry."
    },
    {
      icon: MapPin,
      title: locale === "he" ? "אזורי משלוח" : "Delivery Areas",
      content: locale === "he"
        ? "אנו משלחים לכל רחבי ישראל. משלוחים בינלאומיים זמינים לרוב המדינות - צרו קשר לקבלת הצעת מחיר."
        : "We ship throughout Israel. International shipping is available to most countries - contact us for a quote."
    },
    {
      icon: RefreshCw,
      title: locale === "he" ? "החזרות והחלפות" : "Returns & Exchanges",
      content: locale === "he"
        ? "ניתן להחזיר פריטים סטנדרטיים תוך 14 יום לקבלת החזר מלא. תכשיטים מותאמים אישית אינם ניתנים להחזרה, אך אנו מציעים תיקונים והתאמות בחינם למשך שנה."
        : "Standard items can be returned within 14 days for a full refund. Custom jewelry is non-refundable, but we offer free repairs and adjustments for one year."
    },
    {
      icon: Gift,
      title: locale === "he" ? "משלוח כמתנה" : "Gift Shipping",
      content: locale === "he"
        ? "אנו יכולים לשלוח ישירות לנמען המתנה עם כרטיס ברכה אישי. פשוט ציינו את הפרטים בעת ההזמנה."
        : "We can ship directly to your gift recipient with a personalized greeting card. Simply specify the details during checkout."
    }
  ];

  return (
    <div className="min-h-screen bg-bg-primary py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Link */}
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-text-tertiary hover:text-accent-primary transition-colors mb-8"
        >
          <ChevronLeft className="w-5 h-5" />
          {tCommon("back")}
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 bg-accent-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-16 h-16 bg-bg-secondary border border-border rounded-full flex items-center justify-center">
              <Truck className="w-8 h-8 text-accent-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-4">
            {locale === "he" ? "משלוחים והחזרות" : "Shipping & Returns"}
          </h1>
          <p className="text-text-secondary max-w-2xl mx-auto">
            {locale === "he" 
              ? "כל מה שצריך לדעת על משלוחים, זמני אספקה והחזרות."
              : "Everything you need to know about shipping, delivery times, and returns."
            }
          </p>
        </div>

        {/* Highlight Box */}
        <div className="bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 rounded-2xl p-6 border border-accent-tertiary/30 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-primary/20 rounded-full flex items-center justify-center">
              <Gift className="w-6 h-6 text-accent-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">
                {locale === "he" ? "משלוח חינם!" : "Free Shipping!"}
              </h3>
              <p className="text-text-secondary">
                {locale === "he" 
                  ? "משלוח חינם לכל הזמנה מעל ₪500"
                  : "Free shipping on all orders over ₪500"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-bg-secondary rounded-2xl p-6 border border-border hover:border-accent-tertiary/50 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-bg-tertiary rounded-xl flex items-center justify-center flex-shrink-0">
                  <section.icon className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary mb-2">
                    {section.title}
                  </h2>
                  <p className="text-text-secondary leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
