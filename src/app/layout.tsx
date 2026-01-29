import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gold Jewelry AI - Custom AI-Designed Jewelry",
  description:
    "Create unique, custom-made jewelry pieces using artificial intelligence. Design rings, necklaces, bracelets and more with AI.",
  keywords: [
    "jewelry",
    "custom jewelry",
    "AI design",
    "gold",
    "rings",
    "necklaces",
    "Israel",
  ],
  icons: {
    icon: "/gold-ai-logo.png",
    shortcut: "/gold-ai-logo.png",
    apple: "/gold-ai-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
