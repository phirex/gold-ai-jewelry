"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme = "warm" | "minimal";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: { value: Theme; label: string; description: string }[];
}

const themes: ThemeContextType["themes"] = [
  { value: "minimal", label: "Modern", description: "Clean black & white" },
  { value: "warm", label: "Classic Gold", description: "Warm luxury tones" },
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "gold-ai-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("minimal");
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    // Only accept valid themes (minimal or warm)
    if (stored && themes.some((t) => t.value === stored)) {
      setThemeState(stored);
    }
    setMounted(true);
  }, []);

  // Apply theme class to html element
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Remove all theme classes
    themes.forEach((t) => {
      root.classList.remove(`theme-${t.value}`);
    });

    // Add current theme class
    root.classList.add(`theme-${theme}`);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: "minimal", setTheme, themes }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
