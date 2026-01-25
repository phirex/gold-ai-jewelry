"use client";

import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { DesignStudio } from "@/components/studio/DesignStudio";
import { StudioProvider } from "@/contexts/StudioContext";
import { useTheme } from "@/contexts/ThemeContext";

function HomeContent() {
  const { theme } = useTheme();
  const isApple = theme === "minimal";

  return (
    <div className={`min-h-screen flex flex-col ${isApple ? 'bg-[#FBFBFD]' : 'bg-bg-primary'}`}>
      <Header />

      <main className="flex-1 relative overflow-hidden">
        {/* Background decorative elements - hidden in Apple theme */}
        {!isApple && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-accent-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-accent-secondary/5 rounded-full blur-3xl" />
          </div>
        )}

        <div className="relative z-10 h-full">
          <DesignStudio />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function HomePage() {
  return (
    <StudioProvider>
      <HomeContent />
    </StudioProvider>
  );
}
