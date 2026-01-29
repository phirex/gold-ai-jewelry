"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
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
  Star,
  Play,
  Shield,
  Clock,
  Heart,
} from "lucide-react";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Button } from "@/components/ui/Button";
import { HeroModelViewer } from "@/components/home/HeroModelViewer";
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

// Scroll reveal hook
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: "50px" }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

export default function AboutPage() {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");

  const features = [
    {
      icon: Sparkles,
      title: t("features.ai.title"),
      description: t("features.ai.description"),
      gradient: "from-accent-primary to-accent-secondary",
    },
    {
      icon: Eye,
      title: t("features.preview.title"),
      description: t("features.preview.description"),
      gradient: "from-accent-secondary to-accent-tertiary",
    },
    {
      icon: DollarSign,
      title: t("features.pricing.title"),
      description: t("features.pricing.description"),
      gradient: "from-accent-tertiary to-accent-primary",
    },
    {
      icon: Award,
      title: t("features.quality.title"),
      description: t("features.quality.description"),
      gradient: "from-accent-primary to-accent-tertiary",
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

  const trustBadges = [
    { icon: Shield, label: t("hero.trustBadges.secureCheckout") },
    { icon: Clock, label: t("hero.trustBadges.fastDelivery") },
    { icon: Heart, label: t("hero.trustBadges.madeWithLove") },
    { icon: Award, label: t("hero.trustBadges.qualityGuaranteed") },
  ];

  const stat1 = useCounter(1000);
  const stat2 = useCounter(50);
  const stat3 = useCounter(49);
  const stat4 = useCounter(24);

  const featuresReveal = useScrollReveal();
  const stepsReveal = useScrollReveal();
  const ctaReveal = useScrollReveal();

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden">
          {/* Mesh gradient background */}
          <div className="absolute inset-0 mesh-gradient opacity-60" />

          {/* Animated organic blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute -top-40 -right-40 w-96 h-96 bg-accent-primary/20 rounded-full blur-3xl animate-blob"
              style={{ animationDelay: "0s" }}
            />
            <div
              className="absolute top-1/2 -left-40 w-80 h-80 bg-accent-secondary/20 rounded-full blur-3xl animate-blob"
              style={{ animationDelay: "2s" }}
            />
            <div
              className="absolute -bottom-40 right-1/4 w-72 h-72 bg-accent-tertiary/20 rounded-full blur-3xl animate-blob"
              style={{ animationDelay: "4s" }}
            />
          </div>

          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(15)].map((_, i) => {
              const left = ((i * 37 + 13) % 100);
              const top = ((i * 53 + 7) % 100);
              const delay = (i * 0.3) % 5;
              const duration = 6 + (i % 4);
              return (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-accent-primary/30 rounded-full animate-float"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    animationDelay: `${delay}s`,
                    animationDuration: `${duration}s`,
                  }}
                />
              );
            })}
          </div>

          <div className="container mx-auto px-4 relative z-10 py-20">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left: Content */}
              <div className="text-center lg:text-left rtl:lg:text-right">
                {/* Badge */}
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass-card mb-8 animate-fade-in-down">
                  <Image
                    src="/gold-ai-logo.png"
                    alt={tCommon("appName")}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                  <span className="text-text-secondary font-medium tracking-wide">
                    {tCommon("appName")}
                  </span>
                  <div className="w-2 h-2 bg-accent-primary rounded-full animate-pulse" />
                </div>

                {/* Main heading */}
                <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold mb-8 animate-fade-in-up tracking-tight leading-[1.1]">
                  <span className="text-text-primary">{t("hero.title").split(" ").slice(0, -2).join(" ")} </span>
                  <span className="text-gradient">{t("hero.title").split(" ").slice(-2).join(" ")}</span>
                </h1>

                {/* Subtitle */}
                <p className="text-xl md:text-2xl text-text-secondary mb-10 max-w-xl leading-relaxed animate-fade-in-up" style={{ animationDelay: "100ms" }}>
                  {t("hero.subtitle")}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row rtl:sm:flex-row-reverse gap-4 justify-center lg:justify-start rtl:lg:justify-start animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                  <Link href="/">
                    <Button variant="gradient" size="lg" className="text-lg px-8 group">
                      {t("hero.cta")}
                      <ArrowRight className="ml-2 rtl:ml-0 rtl:mr-2 h-5 w-5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180" />
                    </Button>
                  </Link>
                  <Link href="#how-it-works">
                    <Button
                      variant="outline"
                      size="lg"
                      className="text-lg px-8 group"
                    >
                      <Play className="mr-2 rtl:mr-0 rtl:ml-2 h-5 w-5" />
                      {t("hero.secondary")}
                    </Button>
                  </Link>
                </div>

                {/* Trust indicators */}
                <div className="mt-12 flex flex-wrap gap-6 justify-center lg:justify-start rtl:lg:justify-end rtl:flex-row-reverse animate-fade-in-up" style={{ animationDelay: "300ms" }}>
                  {trustBadges.map((badge, i) => (
                    <div key={i} className="flex items-center gap-2 text-text-tertiary">
                      <badge.icon className="h-4 w-4 text-accent-primary" />
                      <span className="text-sm font-medium">{badge.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: 3D Preview */}
              <div className="animate-fade-in-up lg:animate-fade-in-left" style={{ animationDelay: "400ms" }}>
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute -inset-4 bg-gradient-to-br from-accent-primary/20 via-accent-secondary/20 to-accent-tertiary/20 rounded-3xl blur-2xl" />

                  {/* Main preview container */}
                  <div className="relative glass-card rounded-3xl overflow-hidden aspect-square shadow-heavy">
                    {/* Subtle inner border */}
                    <div className="absolute inset-0 rounded-3xl border border-accent-primary/10" />

                    {/* 3D Model Viewer */}
                    <HeroModelViewer className="absolute inset-0" />

                    {/* Corner accents */}
                    <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-accent-primary/40 rounded-tl-lg pointer-events-none" />
                    <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-accent-primary/40 rounded-tr-lg pointer-events-none" />
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-accent-primary/40 rounded-bl-lg pointer-events-none" />
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-accent-primary/40 rounded-br-lg pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 rounded-full border-2 border-border flex items-start justify-center p-2">
              <div className="w-1.5 h-3 bg-accent-primary rounded-full animate-pulse" />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 relative overflow-hidden bg-bg-secondary border-y border-border">
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              <div ref={stat1.ref} className="text-center group">
                <div className="text-4xl md:text-5xl font-display font-bold text-accent-primary mb-2 group-hover:scale-105 transition-transform">
                  {stat1.count}+
                </div>
                <div className="text-text-secondary font-medium">{t("stats.designs")}</div>
              </div>
              <div ref={stat2.ref} className="text-center group">
                <div className="text-4xl md:text-5xl font-display font-bold text-accent-primary mb-2 group-hover:scale-105 transition-transform">
                  {stat2.count}+
                </div>
                <div className="text-text-secondary font-medium">{t("stats.jewelers")}</div>
              </div>
              <div ref={stat3.ref} className="text-center group">
                <div className="text-4xl md:text-5xl font-display font-bold text-accent-primary mb-2 flex items-center justify-center gap-2 group-hover:scale-105 transition-transform">
                  {(stat3.count / 10).toFixed(1)}
                  <Star className="h-6 w-6 text-accent-secondary fill-accent-secondary" />
                </div>
                <div className="text-text-secondary font-medium">{t("stats.rating")}</div>
              </div>
              <div ref={stat4.ref} className="text-center group">
                <div className="text-4xl md:text-5xl font-display font-bold text-accent-primary mb-2 group-hover:scale-105 transition-transform">
                  {stat4.count}/7
                </div>
                <div className="text-text-secondary font-medium">{t("stats.support")}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Bento Grid */}
        <section ref={featuresReveal.ref} className="py-24 md:py-32 relative overflow-hidden">
          {/* Decorative blob */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="container mx-auto px-4 relative z-10">
            <div className={cn(
              "text-center mb-16 transition-all duration-700",
              featuresReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="text-text-primary">{t("features.title").split(" ").slice(0, -1).join(" ")} </span>
                <span className="text-gradient">{t("features.title").split(" ").slice(-1)}</span>
              </h2>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                {t("features.subtitle")}
              </p>
            </div>

            {/* Features grid - 4 equal columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={cn(
                    "glass-card p-8 rounded-2xl hover-lift group cursor-default transition-all duration-500",
                    featuresReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  )}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Icon */}
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-6",
                    "bg-gradient-to-br shadow-lg",
                    feature.gradient,
                    "group-hover:scale-110 transition-transform duration-300"
                  )}>
                    <feature.icon className="h-7 w-7 text-text-inverse" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold mb-3 text-text-primary group-hover:text-accent-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" ref={stepsReveal.ref} className="py-24 md:py-32 relative bg-bg-secondary overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent-secondary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-tertiary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="container mx-auto px-4 relative z-10">
            <div className={cn(
              "text-center mb-20 transition-all duration-700",
              stepsReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="text-gradient">{t("howItWorks.title")}</span>
              </h2>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                {t("howItWorks.subtitle")}
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              {/* Steps timeline */}
              <div className="relative">
                {/* Connection line - desktop */}
                <div className="hidden lg:block absolute top-20 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-accent-primary/20 via-accent-primary to-accent-primary/20 rounded-full" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                  {steps.map((step, index) => (
                    <div
                      key={index}
                      className={cn(
                        "relative text-center transition-all duration-700",
                        stepsReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                      )}
                      style={{ transitionDelay: `${index * 150}ms` }}
                    >
                      {/* Step number */}
                      <div className="relative inline-block mb-8">
                        <div className="w-20 h-20 rounded-full bg-bg-primary border-2 border-accent-primary/30 flex items-center justify-center relative z-10 group hover:border-accent-primary hover:shadow-glow transition-all duration-300">
                          <span className="text-2xl font-display font-bold text-accent-primary">{step.number}</span>
                        </div>

                        {/* Icon badge */}
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center shadow-lg z-20">
                          <step.icon className="h-5 w-5 text-text-inverse" />
                        </div>
                      </div>

                      <h3 className="text-xl font-semibold mb-4 text-text-primary">{step.title}</h3>
                      <p className="text-text-secondary leading-relaxed max-w-xs mx-auto">
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
        <section ref={ctaReveal.ref} className="py-24 md:py-32 relative overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent-primary via-accent-secondary to-accent-tertiary opacity-90" />

          {/* Mesh overlay */}
          <div className="absolute inset-0 mesh-gradient opacity-30" />

          {/* Floating elements */}
          {[...Array(8)].map((_, i) => {
            const left = 10 + ((i * 41 + 17) % 80);
            const top = 10 + ((i * 59 + 23) % 80);
            const delay = (i * 0.5) % 4;
            const duration = 5 + (i % 5);
            return (
              <div
                key={i}
                className="absolute w-4 h-4 bg-white/20 rounded-full animate-float pointer-events-none"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
                }}
              />
            );
          })}

          <div className={cn(
            "container mx-auto px-4 text-center relative z-10 transition-all duration-700",
            ctaReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-8 text-white drop-shadow-lg">
              {t("cta.title")}
            </h2>
            <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto">
              {t("cta.subtitle")}
            </p>
            <Link href="/" className="inline-block">
              <Button
                size="lg"
                className="text-lg px-12 bg-white text-accent-primary hover:bg-white/90 shadow-2xl group font-semibold"
              >
                {t("cta.button")}
                <ArrowRight className="ml-3 rtl:ml-0 rtl:mr-3 h-5 w-5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
