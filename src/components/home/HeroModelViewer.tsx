"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface HeroModelViewerProps {
  className?: string;
}

export function HeroModelViewer({ className }: HeroModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamically import the model-viewer script
  useEffect(() => {
    if (typeof window !== "undefined" && !customElements.get("model-viewer")) {
      import("@google/model-viewer").then(() => {
        // Give it a moment to register
        setTimeout(() => setIsLoading(false), 100);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-transparent rounded-3xl overflow-hidden",
        className
      )}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-dark-800 border border-gold-500/30 flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-gold-400 animate-spin" />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* @ts-ignore - model-viewer is a web component */}
          <model-viewer
            src="/models/ring_gold_with_diamond.glb"
            alt="Gold ring with diamond"
            camera-controls
            auto-rotate
            auto-rotate-delay="0"
            rotation-per-second="30deg"
            interaction-prompt="none"
            shadow-intensity="0.8"
            shadow-softness="1"
            exposure="1"
            environment-image="neutral"
            camera-orbit="0deg 75deg 105%"
            min-camera-orbit="auto auto 80%"
            max-camera-orbit="auto auto 200%"
            field-of-view="30deg"
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "transparent",
              "--poster-color": "transparent",
            } as React.CSSProperties}
          />

          {/* Hint overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="bg-dark-800/60 backdrop-blur-sm border border-dark-700/50 rounded-full px-4 py-2 text-xs text-dark-300 flex items-center gap-2">
              <RotateCw className="h-3.5 w-3.5 text-gold-400" />
              <span>Drag to rotate</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
