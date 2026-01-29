"use client";

import { useTranslations, useLocale } from "next-intl";
import { ChevronLeft, FileText, Shield, AlertCircle, Scale, Clock, Mail } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  const t = useTranslations("legal.terms");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const sections = [
    {
      icon: FileText,
      title: locale === "he" ? "קבלת התנאים" : "Acceptance of Terms",
      content: locale === "he" 
        ? "בשימוש באתר זה, אתם מסכימים לתנאי השימוש המפורטים להלן. אם אינכם מסכימים לתנאים אלה, אנא הימנעו משימוש באתר."
        : "By using this website, you agree to the terms outlined below. If you do not agree to these terms, please refrain from using the site."
    },
    {
      icon: Shield,
      title: locale === "he" ? "קניין רוחני" : "Intellectual Property",
      content: locale === "he"
        ? "כל התכנים באתר, כולל עיצובים, תמונות, וטכנולוגיות, מוגנים בזכויות יוצרים. אין להעתיק, להפיץ או לשכפל תוכן ללא אישור מראש."
        : "All content on this site, including designs, images, and technologies, is protected by copyright. No content may be copied, distributed, or reproduced without prior permission."
    },
    {
      icon: AlertCircle,
      title: locale === "he" ? "הגבלת אחריות" : "Limitation of Liability",
      content: locale === "he"
        ? "האתר מספק שירותי עיצוב ויצור תכשיטים. איננו אחראים לנזקים עקיפים או תוצאתיים הנובעים משימוש באתר או במוצרים."
        : "The site provides jewelry design and manufacturing services. We are not liable for indirect or consequential damages arising from use of the site or products."
    },
    {
      icon: Scale,
      title: locale === "he" ? "מדיניות ביטולים" : "Cancellation Policy",
      content: locale === "he"
        ? "ניתן לבטל הזמנה תוך 14 ימים מיום הרכישה, בכפוף לתנאי חוק הגנת הצרכן. תכשיטים מותאמים אישית אינם ניתנים להחזרה לאחר תחילת הייצור."
        : "Orders may be cancelled within 14 days of purchase, subject to consumer protection laws. Custom jewelry cannot be returned after production begins."
    },
    {
      icon: Clock,
      title: locale === "he" ? "זמני אספקה" : "Delivery Times",
      content: locale === "he"
        ? "זמני האספקה המשוערים הם 2-4 שבועות לתכשיטים מותאמים אישית. עיכובים עשויים להתרחש עקב מורכבות העיצוב או זמינות חומרים."
        : "Estimated delivery times are 2-4 weeks for custom jewelry. Delays may occur due to design complexity or material availability."
    },
    {
      icon: Mail,
      title: locale === "he" ? "יצירת קשר" : "Contact Us",
      content: locale === "he"
        ? "לשאלות או בירורים בנוגע לתנאי השימוש, אנא פנו אלינו בכתובת support@goldai.com"
        : "For questions or inquiries regarding these terms, please contact us at support@goldai.com"
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
              <FileText className="w-8 h-8 text-accent-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-4">
            {locale === "he" ? "תנאי שימוש" : "Terms of Service"}
          </h1>
          <p className="text-text-secondary max-w-2xl mx-auto">
            {locale === "he" 
              ? "אנא קראו בעיון את תנאי השימוש לפני השימוש באתר ובשירותים שלנו."
              : "Please read these terms carefully before using our website and services."
            }
          </p>
          <p className="text-text-tertiary text-sm mt-4">
            {locale === "he" ? "עודכן לאחרונה: ינואר 2026" : "Last updated: January 2026"}
          </p>
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
