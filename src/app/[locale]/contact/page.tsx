"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ChevronLeft, Mail, Phone, MapPin, Clock, Send, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: locale === "he" ? "אימייל" : "Email",
      value: "support@goldai.com",
      href: "mailto:support@goldai.com",
    },
    {
      icon: Phone,
      title: locale === "he" ? "טלפון" : "Phone",
      value: "+972-3-XXX-XXXX",
      href: "tel:+97230000000",
    },
    {
      icon: MapPin,
      title: locale === "he" ? "כתובת" : "Address",
      value: locale === "he" ? "תל אביב, ישראל" : "Tel Aviv, Israel",
    },
    {
      icon: Clock,
      title: locale === "he" ? "שעות פעילות" : "Hours",
      value: locale === "he" ? "א'-ה' 9:00-18:00" : "Sun-Thu 9:00-18:00",
    },
  ];

  return (
    <div className="min-h-screen bg-bg-primary py-12">
      <div className="max-w-6xl mx-auto px-4">
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
              <MessageSquare className="w-8 h-8 text-accent-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-4">
            {locale === "he" ? "צרו קשר" : "Contact Us"}
          </h1>
          <p className="text-text-secondary max-w-2xl mx-auto">
            {locale === "he" 
              ? "יש לכם שאלה? רעיון לעיצוב? או סתם רוצים להגיד שלום? נשמח לשמוע מכם!"
              : "Have a question? A design idea? Or just want to say hello? We'd love to hear from you!"
            }
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-4">
            {contactInfo.map((item, index) => (
              <div
                key={index}
                className="bg-bg-secondary rounded-xl p-4 border border-border hover:border-accent-tertiary/50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-bg-tertiary rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-accent-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-text-tertiary">{item.title}</p>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="text-text-primary hover:text-accent-primary transition-colors"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-text-primary">{item.value}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-bg-secondary rounded-2xl p-6 border border-border">
              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    {locale === "he" ? "תודה על פנייתכם!" : "Thank you for reaching out!"}
                  </h3>
                  <p className="text-text-secondary">
                    {locale === "he" 
                      ? "נחזור אליכם בהקדם האפשרי."
                      : "We'll get back to you as soon as possible."
                    }
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        {locale === "he" ? "שם" : "Name"} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        className="w-full px-4 py-3 border border-border rounded-xl bg-bg-tertiary text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        {locale === "he" ? "אימייל" : "Email"} *
                      </label>
                      <input
                        type="email"
                        required
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        className="w-full px-4 py-3 border border-border rounded-xl bg-bg-tertiary text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary/50 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      {locale === "he" ? "נושא" : "Subject"} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formState.subject}
                      onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                      className="w-full px-4 py-3 border border-border rounded-xl bg-bg-tertiary text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      {locale === "he" ? "הודעה" : "Message"} *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formState.message}
                      onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                      className="w-full px-4 py-3 border border-border rounded-xl bg-bg-tertiary text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary/50 transition-all resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-gradient-to-r from-accent-primary to-accent-secondary text-bg-primary font-semibold rounded-xl transition-all shadow-lg shadow-accent-primary/25 hover:shadow-accent-secondary/40 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />
                        {locale === "he" ? "שולח..." : "Sending..."}
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {locale === "he" ? "שליחה" : "Send Message"}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
