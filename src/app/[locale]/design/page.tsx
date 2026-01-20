"use client";

import { useTranslations } from "next-intl";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { DesignWizard } from "@/components/design/DesignWizard";

export default function DesignPage() {
  const t = useTranslations("design.wizard");

  return (
    <div className="min-h-screen flex flex-col bg-dark-900">
      <Header />

      <main className="flex-1 py-8 md:py-12 px-4">
        <div className="container mx-auto">
          <h1 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12 text-gradient-gold-bright animate-fade-in-down">
            {t("title")}
          </h1>

          <DesignWizard />
        </div>
      </main>

      <Footer />
    </div>
  );
}
