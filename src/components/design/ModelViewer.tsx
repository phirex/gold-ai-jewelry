"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, RotateCw, ZoomIn, Maximize2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ModelViewerProps {
  modelUrl?: string | null;
  previewImageUrl?: string | null;
  isLoading?: boolean;
  loadingStage?: string;
  className?: string;
}

export function ModelViewer({
  modelUrl,
  previewImageUrl,
  isLoading = false,
  loadingStage,
  className,
}: ModelViewerProps) {
  const t = useTranslations("design.preview");
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // We'll use Google's model-viewer web component
  useEffect(() => {
    // Dynamically import the model-viewer script
    if (typeof window !== "undefined" && !customElements.get("model-viewer")) {
      import("@google/model-viewer");
    }
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-gradient-to-br from-dark-850 to-dark-900 rounded-2xl overflow-hidden border border-dark-700",
        className
      )}
    >
      {/* Subtle corner accents */}
      <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-gold-500/10 to-transparent rounded-br-full" />
      <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-gold-500/10 to-transparent rounded-tl-full" />

      {isLoading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Show preview image while converting to 3D */}
          {previewImageUrl ? (
            <div className="relative w-full h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImageUrl}
                alt={t("imageAlt")}
                className="w-full h-full object-contain opacity-70"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-dark-900/90 via-dark-900/50 to-transparent">
                <div className="bg-dark-800/90 border border-gold-500/30 backdrop-blur-sm rounded-2xl p-6 flex flex-col items-center">
                  <Loader2 className="h-10 w-10 text-gold-400 animate-spin mb-3" />
                  <p className="text-dark-100 font-medium px-4 text-center">
                    {loadingStage || t("loading")}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-20 h-20 rounded-full bg-dark-800 border border-gold-500/30 flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-gold-400 animate-spin" />
                </div>
              </div>
              <p className="text-dark-300 mt-4 font-medium">{loadingStage || t("loading")}</p>
            </div>
          )}
        </div>
      ) : modelUrl ? (
        <>
          {/* @ts-ignore - model-viewer is a web component */}
          <model-viewer
            src={modelUrl}
            alt={t("modelAlt")}
            auto-rotate
            camera-controls
            shadow-intensity="1"
            exposure="0.5"
            environment-image="neutral"
            style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
          />

          {/* Controls overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
            <div className="bg-dark-800/80 backdrop-blur-sm border border-dark-700 rounded-xl px-4 py-2 text-xs text-dark-300">
              <span className="flex items-center gap-2">
                <RotateCw className="h-3.5 w-3.5 text-gold-400" /> {t("rotate")}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-2.5 bg-dark-800/80 backdrop-blur-sm border border-dark-700 rounded-xl hover:border-gold-500/50 hover:bg-dark-700 text-dark-300 hover:text-gold-400 transition-all duration-200"
                aria-label={t("toggleFullscreen")}
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gold-500/10 rounded-full blur-2xl animate-breathe" />
            <div className="relative w-24 h-24 bg-dark-800 border border-gold-500/20 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="h-10 w-10 text-gold-400" />
            </div>
          </div>
          <p className="text-dark-400 font-medium">{t("noDesign")}</p>
        </div>
      )}
    </div>
  );
}
