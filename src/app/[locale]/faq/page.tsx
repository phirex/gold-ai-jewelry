"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ChevronLeft, HelpCircle, ChevronDown, ChevronUp, Search } from "lucide-react";
import Link from "next/link";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function FAQPage() {
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const faqs: FAQItem[] = locale === "he" ? [
    {
      category: "כללי",
      question: "איך עובד תהליך העיצוב?",
      answer: "פשוט תארו את תכשיט החלומות שלכם במילים, ומערכת ה-AI שלנו תיצור עיצובים ייחודיים. תוכלו לשפר את העיצוב דרך צ'אט, לצפות בו בתלת-מימד, ולהזמין כשתהיו מרוצים."
    },
    {
      category: "כללי",
      question: "האם העיצובים באמת ייחודיים?",
      answer: "כן! כל עיצוב נוצר במיוחד עבורכם על ידי AI מתקדם. גם אם שני אנשים יתארו משהו דומה, התוצאות יהיו שונות ומקוריות."
    },
    {
      category: "ייצור",
      question: "כמה זמן לוקח לייצר תכשיט?",
      answer: "זמן הייצור הממוצע הוא 2-3 שבועות לתכשיטים מותאמים אישית. עיצובים מורכבים יותר עשויים לקחת עד 4 שבועות. תקבלו עדכונים שוטפים לאורך התהליך."
    },
    {
      category: "ייצור",
      question: "מי מייצר את התכשיטים?",
      answer: "התכשיטים מיוצרים על ידי צורפים מומחים עם ניסיון של שנים. הם משתמשים בשיטות מסורתיות בשילוב טכנולוגיות מתקדמות להבטחת איכות מעולה."
    },
    {
      category: "חומרים",
      question: "אילו חומרים אתם משתמשים?",
      answer: "אנו משתמשים רק בחומרים איכותיים: זהב 14K ו-18K, כסף סטרלינג 925, פלטינה, ואבני חן טבעיות מאושרות. כל תכשיט מגיע עם תעודת אותנטיות."
    },
    {
      category: "חומרים",
      question: "האם האבנים טבעיות?",
      answer: "כן, אנו משתמשים באבני חן טבעיות בלבד. היהלומים שלנו הם Conflict-Free ומגיעים עם אישורים מתאימים. ניתן גם לבחור באבנים מעבדתיות אם תרצו."
    },
    {
      category: "תשלום",
      question: "אילו אמצעי תשלום מקבלים?",
      answer: "אנו מקבלים את כל כרטיסי האשראי הנפוצים (ויזה, מאסטרקארד, ישראכרט, אמקס). ניתן גם לשלם בתשלומים ללא ריבית."
    },
    {
      category: "תשלום",
      question: "האם התשלום מאובטח?",
      answer: "בהחלט! אנו משתמשים במערכת תשלומים מאובטחת בתקן PCI-DSS. פרטי כרטיס האשראי שלכם מוצפנים ואינם נשמרים במערכות שלנו."
    },
    {
      category: "משלוח",
      question: "לאן אתם שולחים?",
      answer: "אנו שולחים לכל רחבי ישראל. משלוח חינם להזמנות מעל ₪500. משלוחים בינלאומיים זמינים - צרו קשר לקבלת הצעת מחיר."
    },
    {
      category: "החזרות",
      question: "מה מדיניות ההחזרות?",
      answer: "פריטים סטנדרטיים ניתנים להחזרה תוך 14 יום. תכשיטים מותאמים אישית אינם ניתנים להחזרה, אך אנו מציעים תיקונים והתאמות חינם למשך שנה."
    }
  ] : [
    {
      category: "General",
      question: "How does the design process work?",
      answer: "Simply describe your dream jewelry in words, and our AI system will create unique designs. You can refine the design through chat, view it in 3D, and order when you're satisfied."
    },
    {
      category: "General",
      question: "Are the designs truly unique?",
      answer: "Yes! Every design is created specifically for you by advanced AI. Even if two people describe something similar, the results will be different and original."
    },
    {
      category: "Manufacturing",
      question: "How long does it take to make jewelry?",
      answer: "Average production time is 2-3 weeks for custom jewelry. More complex designs may take up to 4 weeks. You'll receive regular updates throughout the process."
    },
    {
      category: "Manufacturing",
      question: "Who makes the jewelry?",
      answer: "Jewelry is crafted by expert jewelers with years of experience. They use traditional methods combined with advanced technology to ensure excellent quality."
    },
    {
      category: "Materials",
      question: "What materials do you use?",
      answer: "We use only quality materials: 14K and 18K gold, sterling silver 925, platinum, and certified natural gemstones. Every piece comes with a certificate of authenticity."
    },
    {
      category: "Materials",
      question: "Are the stones natural?",
      answer: "Yes, we use natural gemstones only. Our diamonds are Conflict-Free and come with appropriate certifications. Lab-grown stones are also available upon request."
    },
    {
      category: "Payment",
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, American Express). Interest-free installment payments are also available."
    },
    {
      category: "Payment",
      question: "Is payment secure?",
      answer: "Absolutely! We use a PCI-DSS compliant payment system. Your credit card details are encrypted and not stored in our systems."
    },
    {
      category: "Shipping",
      question: "Where do you ship?",
      answer: "We ship throughout Israel. Free shipping on orders over ₪500. International shipping is available - contact us for a quote."
    },
    {
      category: "Returns",
      question: "What's your return policy?",
      answer: "Standard items can be returned within 14 days. Custom jewelry is non-refundable, but we offer free repairs and adjustments for one year."
    }
  ];

  const filteredFaqs = searchQuery
    ? faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

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
              <HelpCircle className="w-8 h-8 text-accent-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-4">
            {locale === "he" ? "שאלות נפוצות" : "Frequently Asked Questions"}
          </h1>
          <p className="text-text-secondary max-w-2xl mx-auto">
            {locale === "he" 
              ? "מצאו תשובות לשאלות הנפוצות ביותר שלנו. לא מצאתם את מה שחיפשתם? צרו קשר!"
              : "Find answers to our most common questions. Can't find what you're looking for? Contact us!"
            }
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            placeholder={locale === "he" ? "חיפוש שאלות..." : "Search questions..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-border rounded-xl bg-bg-secondary text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary/50 transition-all"
          />
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 bg-bg-secondary rounded-2xl border border-border">
              <p className="text-text-secondary">
                {locale === "he" ? "לא נמצאו תוצאות" : "No results found"}
              </p>
            </div>
          ) : (
            filteredFaqs.map((faq, index) => (
              <div
                key={index}
                className="bg-bg-secondary rounded-xl border border-border overflow-hidden transition-all hover:border-accent-tertiary/50"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 bg-bg-tertiary rounded-full text-text-tertiary">
                      {faq.category}
                    </span>
                    <span className="font-medium text-text-primary">{faq.question}</span>
                  </div>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-accent-primary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-text-tertiary flex-shrink-0" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-4">
                    <p className="text-text-secondary leading-relaxed border-t border-border pt-4">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 rounded-2xl p-8 border border-accent-tertiary/30">
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            {locale === "he" ? "לא מצאתם תשובה?" : "Didn't find an answer?"}
          </h3>
          <p className="text-text-secondary mb-4">
            {locale === "he" 
              ? "צוות התמיכה שלנו ישמח לעזור"
              : "Our support team is happy to help"
            }
          </p>
          <Link
            href={`/${locale}/contact`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-primary to-accent-secondary text-bg-primary font-semibold rounded-xl transition-all shadow-lg shadow-accent-primary/25 hover:shadow-accent-secondary/40 hover:shadow-xl"
          >
            {locale === "he" ? "צרו קשר" : "Contact Us"}
          </Link>
        </div>
      </div>
    </div>
  );
}
