"use client";

import { useTranslations } from "next-intl";
import { ControlPanel } from "./ControlPanel";
import { PreviewPanel } from "./PreviewPanel";
import { ChatPanel } from "./ChatPanel";
import { MobileBottomSheet } from "./MobileBottomSheet";
import { cn } from "@/lib/utils/cn";

export function DesignStudio() {
  const t = useTranslations("studio");

  return (
    <div className="h-full">
      {/* Desktop Layout: 3-column */}
      <div className="hidden lg:grid lg:grid-cols-[280px_1fr_320px] gap-4 p-4 h-[calc(100vh-140px)]">
        {/* Left: Control Panel */}
        <div className="h-full overflow-hidden">
          <ControlPanel />
        </div>

        {/* Center: Preview Panel */}
        <div className="h-full overflow-hidden">
          <PreviewPanel />
        </div>

        {/* Right: Chat Panel */}
        <div className="h-full overflow-hidden">
          <ChatPanel />
        </div>
      </div>

      {/* Mobile Layout: Stacked with bottom sheet */}
      <div className="lg:hidden flex flex-col h-[calc(100vh-120px)]">
        {/* Preview area takes most of the screen */}
        <div className="flex-1 p-3 overflow-hidden">
          <PreviewPanel isMobile />
        </div>

        {/* Bottom Sheet with controls */}
        <MobileBottomSheet />
      </div>
    </div>
  );
}
