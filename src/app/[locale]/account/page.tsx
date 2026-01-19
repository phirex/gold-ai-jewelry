"use client";

import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Palette,
  ShoppingBag,
  MapPin,
  Settings,
  ChevronRight,
  User,
  LogOut,
  Loader2,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";

export default function AccountPage() {
  const t = useTranslations("account");
  const tNav = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/auth/signin`);
    }
  }, [status, router, locale]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="relative">
          <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-full bg-dark-800 border border-gold-500/30 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-gold-400 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const menuItems = [
    {
      href: `/${locale}/account/designs`,
      icon: Palette,
      title: t("designs.title"),
      description: t("menu.designsDescription"),
    },
    {
      href: `/${locale}/account/orders`,
      icon: ShoppingBag,
      title: t("orders.title"),
      description: t("menu.ordersDescription"),
    },
    {
      href: `/${locale}/account/addresses`,
      icon: MapPin,
      title: t("addresses.title"),
      description: t("menu.addressesDescription"),
    },
    {
      href: `/${locale}/account/settings`,
      icon: Settings,
      title: t("settings.title"),
      description: t("menu.settingsDescription"),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-dark-900">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header Card */}
          <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 mb-6 animate-fade-in-up">
            <div className="flex items-center gap-4">
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || t("defaultUser")}
                  className="w-16 h-16 rounded-full ring-4 ring-gold-500/30 shadow-lg shadow-gold-500/10"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-gold-400 rounded-full flex items-center justify-center shadow-lg shadow-gold-500/20">
                  <User className="w-8 h-8 text-dark-900" />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gradient-gold-bright">{session.user?.name || t("defaultUser")}</h1>
                <p className="text-dark-400">
                  {session.user?.email}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: `/${locale}` })}
                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span>{tAuth("signOut")}</span>
              </button>
            </div>
          </div>

          {/* Menu Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {menuItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className="bg-dark-800 rounded-2xl p-6 border border-dark-700 hover:border-gold-500/50 transition-all flex items-center gap-4 group animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-gold-500 to-gold-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-gold-500/20 group-hover:scale-110 transition-transform">
                  <item.icon className="w-7 h-7 text-dark-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-lg text-dark-100 group-hover:text-gold-400 transition-colors">{item.title}</h2>
                  <p className="text-sm text-dark-500 truncate">
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-dark-600 group-hover:text-gold-400 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
