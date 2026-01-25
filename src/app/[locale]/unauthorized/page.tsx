import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return {
    title: t("unauthorized.title"),
  };
}

interface UnauthorizedPageProps {
  params: Promise<{ locale: string }>;
}

export default async function UnauthorizedPage({ params }: UnauthorizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations("admin.unauthorized");

  return (
    <main className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">
          {t("title")}
        </h1>
        
        <p className="text-dark-400 mb-8">
          {t("message")}
        </p>
        
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 text-dark-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t("backHome")}
        </Link>
      </div>
    </main>
  );
}
