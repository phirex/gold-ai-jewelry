"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import {
  Sparkles,
  Eye,
  DollarSign,
  Award,
  MessageSquare,
  Palette,
  Truck,
  ArrowRight,
  Gem,
  Star,
} from "lucide-react";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

// Animated counter hook
function useCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isVisible, end, duration]);

  return { count, ref };
}

export default function HomePage() {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");

  const features = [
    {
      icon: Sparkles,
      title: t("features.ai.title"),
      description: t("features.ai.description"),
    },
    {
      icon: Eye,
      title: t("features.preview.title"),
      description: t("features.preview.description"),
    },
    {
      icon: DollarSign,
      title: t("features.pricing.title"),
      description: t("features.pricing.description"),
    },
    {
      icon: Award,
      title: t("features.quality.title"),
      description: t("features.quality.description"),
    },
  ];

  const steps = [
    {
      number: "01",
      icon: MessageSquare,
      title: t("howItWorks.step1.title"),
      description: t("howItWorks.step1.description"),
    },
    {
      number: "02",
      icon: Sparkles,
      title: t("howItWorks.step2.title"),
      description: t("howItWorks.step2.description"),
    },
    {
      number: "03",
      icon: Palette,
      title: t("howItWorks.step3.title"),
      description: t("howItWorks.step3.description"),
    },
    {
      number: "04",
      icon: Truck,
      title: t("howItWorks.step4.title"),
      description: t("howItWorks.step4.description"),
    },
  ];

  const stat1 = useCounter(1000);
  const stat2 = useCounter(50);
  const stat3 = useCounter(49);
  const stat4 = useCounter(24);

  return (
    <div className="min-h-screen flex flex-col bg-dark-900">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            {/* Main radial glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold-500/10 rounded-full blur-[120px] animate-breathe" />

            {/* Secondary glows */}
            <div className="absolute top-20 left-20 w-[400px] h-[400px] bg-gold-600/5 rounded-full blur-[100px] animate-float-slow" />
            <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-gold-400/5 rounded-full blur-[100px] animate-float" />

            {/* Floating gold particles */}
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-gold-400/40 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${4 + Math.random() * 6}s`,
                }}
              />
            ))}

            {/* Grid pattern overlay */}
            <div
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `linear-gradient(rgba(212, 160, 0, 0.3) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(212, 160, 0, 0.3) 1px, transparent 1px)`,
                backgroundSize: '60px 60px',
              }}
            />
          </div>

          <div className="container mx-auto px-4 relative z-10 py-20">
            <div className="max-w-5xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass-gold mb-10 animate-fade-in-down">
                <Gem className="h-5 w-5 text-gold-400" />
                <span className="text-gold-300 font-medium tracking-wide">{tCommon("appName")}</span>
                <div className="w-2 h-2 bg-gold-400 rounded-full animate-pulse" />
              </div>

              {/* Main heading */}
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 animate-fade-in-up tracking-tight">
                <span className="text-gradient-gold-bright">{t("hero.title")}</span>
              </h1>

              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-dark-200 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up delay-100">
                {t("hero.subtitle")}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-5 justify-center animate-fade-in-up delay-200">
                <Link href="/design">
                  <Button variant="gradient" size="lg" className="text-lg px-10 py-6 group">
                    {t("hero.cta")}
                    <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-lg px-10 py-6 border-dark-500 text-dark-100 hover:bg-dark-800 hover:border-gold-500/50"
                  >
                    {t("hero.secondary")}
                  </Button>
                </Link>
              </div>

              {/* Hero Preview */}
              <div className="mt-24 max-w-4xl mx-auto animate-fade-in-up delay-300">
                <div className="relative">
                  {/* Glow behind preview */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-gold-500/20 via-gold-400/30 to-gold-500/20 rounded-3xl blur-2xl opacity-60" />

                  {/* Main preview container */}
                  <div className="relative glass-card rounded-3xl overflow-hidden aspect-video">
                    {/* Animated border */}
                    <div className="absolute inset-0 rounded-3xl border border-gold-500/20 animate-border-glow" />

                    {/* Shimmer overlay */}
                    <div className="absolute inset-0 shimmer-gold opacity-30" />

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mb-8 animate-pulse-gold-subtle">
                        <Sparkles className="h-14 w-14 text-dark-900" />
                      </div>
                      <p className="text-xl text-dark-200 font-medium">{t("preview3d")}</p>
                    </div>

                    {/* Corner accents */}
                    <div className="absolute top-6 left-6 w-12 h-12 border-l-2 border-t-2 border-gold-500/40 rounded-tl-xl" />
                    <div className="absolute top-6 right-6 w-12 h-12 border-r-2 border-t-2 border-gold-500/40 rounded-tr-xl" />
                    <div className="absolute bottom-6 left-6 w-12 h-12 border-l-2 border-b-2 border-gold-500/40 rounded-bl-xl" />
                    <div className="absolute bottom-6 right-6 w-12 h-12 border-r-2 border-b-2 border-gold-500/40 rounded-br-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 rounded-full border-2 border-dark-500 flex items-start justify-center p-2">
              <div className="w-1.5 h-3 bg-gold-400 rounded-full animate-pulse" />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 relative overflow-hidden border-y border-dark-700">
          <div className="absolute inset-0 bg-gradient-to-r from-dark-800 via-dark-850 to-dark-800" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              <div ref={stat1.ref} className="text-center">
                <div className="text-4xl md:text-6xl font-bold text-gradient-gold mb-3">
                  {stat1.count}+
                </div>
                <div className="text-dark-300 font-medium">{t("stats.designs")}</div>
              </div>
              <div ref={stat2.ref} className="text-center">
                <div className="text-4xl md:text-6xl font-bold text-gradient-gold mb-3">
                  {stat2.count}+
                </div>
                <div className="text-dark-300 font-medium">{t("stats.jewelers")}</div>
              </div>
              <div ref={stat3.ref} className="text-center">
                <div className="text-4xl md:text-6xl font-bold text-gradient-gold mb-3 flex items-center justify-center gap-2">
                  {(stat3.count / 10).toFixed(1)}
                  <Star className="h-8 w-8 text-gold-400 fill-gold-400" />
                </div>
                <div className="text-dark-300 font-medium">{t("stats.rating")}</div>
              </div>
              <div ref={stat4.ref} className="text-center">
                <div className="text-4xl md:text-6xl font-bold text-gradient-gold mb-3">
                  {stat4.count}/7
                </div>
                <div className="text-dark-300 font-medium">{t("stats.support")}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 relative">
          <div className="absolute inset-0 radial-glow" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="text-gradient-gold">{t("features.title")}</span>
              </h2>
              <div className="w-24 h-1 mx-auto bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={cn(
                    "card-luxury p-8 hover-lift group animate-fade-in-up cursor-default"
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-gold-500/20">
                    <feature.icon className="h-8 w-8 text-dark-900" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold mb-4 text-foreground group-hover:text-gold-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-dark-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-32 relative bg-dark-850">
          <div className="container mx-auto px-4">
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="text-gradient-gold">{t("howItWorks.title")}</span>
              </h2>
              <div className="w-24 h-1 mx-auto bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
            </div>

            <div className="max-w-6xl mx-auto">
              <div className="relative">
                {/* Connection line - desktop */}
                <div className="hidden lg:block absolute top-24 left-[10%] right-[10%] h-0.5">
                  <div className="h-full bg-gradient-to-r from-dark-600 via-gold-500/50 to-dark-600 rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                  {steps.map((step, index) => (
                    <div
                      key={index}
                      className="relative animate-fade-in-up text-center"
                      style={{ animationDelay: `${index * 150}ms` }}
                    >
                      {/* Step number */}
                      <div className="relative inline-block mb-8">
                        <div className="w-24 h-24 rounded-full bg-dark-800 border-2 border-gold-500/30 flex items-center justify-center relative z-10 group hover:border-gold-500 transition-colors">
                          <span className="text-3xl font-bold text-gradient-gold">{step.number}</span>

                          {/* Glow effect on hover */}
                          <div className="absolute inset-0 rounded-full bg-gold-500/10 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                        </div>

                        {/* Icon badge */}
                        <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg z-20">
                          <step.icon className="h-6 w-6 text-dark-900" />
                        </div>
                      </div>

                      <h3 className="text-xl font-semibold mb-4 text-foreground">{step.title}</h3>
                      <p className="text-dark-300 leading-relaxed max-w-xs mx-auto">
                        {step.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gold-600 via-gold-500 to-gold-700" />

          {/* Pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(0,0,0,0.3) 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }}
          />

          {/* Floating elements */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-4 h-4 bg-white/10 rounded-full animate-float"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${5 + Math.random() * 5}s`,
              }}
            />
          ))}

          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 text-dark-900 animate-fade-in-up">
              {t("cta.title")}
            </h2>
            <p className="text-xl md:text-2xl text-dark-800 mb-12 max-w-2xl mx-auto animate-fade-in-up delay-100">
              {t("cta.subtitle")}
            </p>
            <Link href="/design" className="inline-block animate-fade-in-up delay-200">
              <Button
                size="lg"
                className="text-lg px-12 py-6 bg-dark-900 text-gold-400 hover:bg-dark-800 hover:text-gold-300 shadow-2xl group"
              >
                {t("cta.button")}
                <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
