"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Palette,
  ChevronLeft,
  Plus,
  Trash2,
  ShoppingCart,
  Eye,
} from "lucide-react";
import { formatPrice } from "@/lib/pricing/calculator";

interface Design {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  jewelryType: string;
  material: string;
  estimatedPrice: number | null;
  status: string;
  createdAt: string;
}

export default function MyDesignsPage() {
  const t = useTranslations("account");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/auth/signin`);
    }
  }, [status, router, locale]);

  useEffect(() => {
    if (session?.user) {
      fetchDesigns();
    }
  }, [session]);

  const fetchDesigns = async () => {
    try {
      const response = await fetch("/api/user/designs");
      if (response.ok) {
        const data = await response.json();
        setDesigns(data.designs || []);
      }
    } catch (error) {
      console.error("Failed to fetch designs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (designId: string) => {
    if (!confirm("Are you sure you want to delete this design?")) return;

    try {
      const response = await fetch(`/api/user/designs/${designId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setDesigns(designs.filter((d) => d.id !== designId));
      }
    } catch (error) {
      console.error("Failed to delete design:", error);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href={`/${locale}/account`}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">{t("designs.title")}</h1>
          </div>
          <Link
            href={`/${locale}/design`}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Design</span>
          </Link>
        </div>

        {/* Designs Grid */}
        {designs.length === 0 ? (
          <div className="text-center py-16">
            <Palette className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t("designs.empty")}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Start creating beautiful custom jewelry
            </p>
            <Link
              href={`/${locale}/design`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Design
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map((design) => (
              <div
                key={design.id}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative">
                  {design.thumbnailUrl ? (
                    <img
                      src={design.thumbnailUrl}
                      alt={design.name || "Design"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Palette className="w-16 h-16 text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <Link
                      href={`/${locale}/design/studio?id=${design.id}`}
                      className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Eye className="w-5 h-5 text-gray-800" />
                    </Link>
                    <button
                      onClick={() => handleDelete(design.id)}
                      className="p-3 bg-white rounded-full hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4">
                  <h3 className="font-semibold truncate">
                    {design.name || "Untitled Design"}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {design.jewelryType} - {design.material.replace("_", " ")}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-amber-600">
                      {design.estimatedPrice
                        ? formatPrice(design.estimatedPrice)
                        : "Price TBD"}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        design.status === "saved"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : design.status === "ordered"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {design.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
