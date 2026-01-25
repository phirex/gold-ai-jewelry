import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth/admin";
import { PricingDashboard } from "@/components/admin/PricingDashboard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.pricing");
  return {
    title: t("title"),
    description: t("description"),
  };
}

interface AdminPricingPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminPricingPage({ params }: AdminPricingPageProps) {
  const { locale } = await params;
  
  // Require admin authentication (redirects to login if not authenticated)
  const session = await requireAdmin(locale);

  return (
    <main className="min-h-screen bg-dark-900">
      <PricingDashboard 
        locale={locale} 
        user={{
          name: session.user.name,
          email: session.user.email,
        }}
      />
    </main>
  );
}
