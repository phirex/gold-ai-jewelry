"use client";

import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Gem, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function SignInPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
  };

  const handleFacebookSignIn = () => {
    signIn("facebook", { callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-gold-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl animate-breathe" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-[100px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2.5 font-bold text-2xl mb-8 animate-fade-in-down group"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gold-400/30 rounded-full blur-md group-hover:bg-gold-400/40 transition-all" />
            <Gem className="relative h-8 w-8 text-gold-400 transition-transform group-hover:scale-110" />
            <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-gold-300 animate-pulse" />
          </div>
          <span className="text-gradient-gold-bright">{tCommon("appName")}</span>
        </Link>

        {/* Sign In Card */}
        <div className="bg-dark-800 rounded-3xl shadow-2xl border border-dark-700 p-8 animate-fade-in-up">
          <h1 className="text-2xl font-bold text-center mb-2 text-gradient-gold-bright">{t("signIn")}</h1>
          <p className="text-dark-400 text-center mb-8">
            {t("signInSubtitle")}
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm animate-fade-in">
              {error === "OAuthAccountNotLinked"
                ? t("errorOAuth")
                : t("errorGeneric")}
            </div>
          )}

          {/* Social Sign In Buttons */}
          <div className="space-y-4">
            <button
              className="w-full h-12 relative flex items-center justify-center gap-3 bg-dark-700 border border-dark-600 hover:border-gold-500/50 hover:bg-dark-600 text-dark-200 font-medium rounded-xl transition-all"
              onClick={handleGoogleSignIn}
            >
              <svg
                className="absolute left-4 h-5 w-5"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {t("google")}
            </button>

            <button
              className="w-full h-12 relative flex items-center justify-center gap-3 bg-dark-700 border border-dark-600 hover:border-gold-500/50 hover:bg-dark-600 text-dark-200 font-medium rounded-xl transition-all"
              onClick={handleFacebookSignIn}
            >
              <svg
                className="absolute left-4 h-5 w-5"
                viewBox="0 0 24 24"
                fill="#1877F2"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              {t("facebook")}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-dark-800 px-3 text-dark-500">
                {t("orContinueWith")}
              </span>
            </div>
          </div>

          {/* Guest Continue */}
          <Link href="/design">
            <Button variant="ghost" className="w-full">
              {t("continueAsGuest")}
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-dark-500 mt-8 animate-fade-in-up delay-200">
          {t("termsPrefix")}{" "}
          <Link href="/terms" className="text-gold-400 hover:text-gold-300 hover:underline transition-colors">
            {t("termsLink")}
          </Link>{" "}
          {t("and")}{" "}
          <Link href="/privacy" className="text-gold-400 hover:text-gold-300 hover:underline transition-colors">
            {t("privacyLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
