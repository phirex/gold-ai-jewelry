"use client";

import { useTranslations } from "next-intl";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { DesignWizard } from "@/components/design/DesignWizard";

export default function DesignPage() {
  const t = useTranslations("design.wizard");

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <Header />

      <main className="flex-1 py-8 md:py-12 px-4 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto relative z-10">
          <h1 className="font-display text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12 text-gradient animate-fade-in-down">
            {t("title")}
          </h1>

          <DesignWizard />
        </div>
      </main>

      <Footer />
    </div>
  );
}
