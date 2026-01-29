"use client";

import { useTranslations, useLocale } from "next-intl";
import { ChevronLeft, Shield, Eye, Lock, Database, Globe, Settings } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const sections = [
    {
      icon: Database,
      title: locale === "he" ? "מידע שאנו אוספים" : "Information We Collect",
      content: locale === "he" 
        ? "אנו אוספים מידע שאתם מספקים לנו ישירות: שם, כתובת אימייל, טלפון, כתובת למשלוח, ופרטי תשלום. בנוסף, אנו אוספים מידע על העיצובים שאתם יוצרים באמצעות הפלטפורמה שלנו."
        : "We collect information you provide directly: name, email, phone, shipping address, and payment details. Additionally, we collect information about designs you create using our platform."
    },
    {
      icon: Eye,
      title: locale === "he" ? "כיצד אנו משתמשים במידע" : "How We Use Information",
      content: locale === "he"
        ? "אנו משתמשים במידע שלכם כדי: לעבד הזמנות ותשלומים, ליצור ולספק תכשיטים מותאמים אישית, לשלוח עדכונים על הזמנות, ולשפר את השירותים שלנו."
        : "We use your information to: process orders and payments, create and deliver custom jewelry, send order updates, and improve our services."
    },
    {
      icon: Lock,
      title: locale === "he" ? "אבטחת מידע" : "Data Security",
      content: locale === "he"
        ? "אנו מיישמים אמצעי אבטחה מתקדמים להגנה על המידע שלכם. תשלומים מעובדים באמצעות מערכות מאובטחות בתקן PCI-DSS. איננו שומרים פרטי כרטיס אשראי במערכות שלנו."
        : "We implement advanced security measures to protect your information. Payments are processed through PCI-DSS compliant systems. We do not store credit card details in our systems."
    },
    {
      icon: Globe,
      title: locale === "he" ? "שיתוף מידע" : "Information Sharing",
      content: locale === "he"
        ? "איננו מוכרים או משכירים את המידע האישי שלכם לצדדים שלישיים. אנו עשויים לשתף מידע עם ספקי שירות הנדרשים לעיבוד הזמנות ומשלוחים."
        : "We do not sell or rent your personal information to third parties. We may share information with service providers necessary for order processing and shipping."
    },
    {
      icon: Settings,
      title: locale === "he" ? "הזכויות שלכם" : "Your Rights",
      content: locale === "he"
        ? "יש לכם זכות לגשת למידע שלכם, לתקן אותו, או לבקש את מחיקתו. ניתן לפנות אלינו בכל עת לבירורים או בקשות בנושא הפרטיות שלכם."
        : "You have the right to access, correct, or request deletion of your information. Contact us anytime for privacy-related inquiries or requests."
    },
    {
      icon: Shield,
      title: locale === "he" ? "עוגיות (Cookies)" : "Cookies",
      content: locale === "he"
        ? "אנו משתמשים בעוגיות לשיפור חוויית המשתמש ולניתוח תנועה באתר. ניתן לשלוט בהעדפות העוגיות דרך הגדרות הדפדפן שלכם."
        : "We use cookies to improve user experience and analyze site traffic. You can control cookie preferences through your browser settings."
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
              <Shield className="w-8 h-8 text-accent-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-4">
            {locale === "he" ? "מדיניות פרטיות" : "Privacy Policy"}
          </h1>
          <p className="text-text-secondary max-w-2xl mx-auto">
            {locale === "he" 
              ? "הפרטיות שלכם חשובה לנו. מדיניות זו מסבירה כיצד אנו אוספים, משתמשים ומגנים על המידע שלכם."
              : "Your privacy matters to us. This policy explains how we collect, use, and protect your information."
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
