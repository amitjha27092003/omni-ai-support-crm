"use client";

import React from "react";
import { Globe } from "lucide-react";
import { getLanguageFamily } from "@/lib/languageDetection";

interface SupportLanguageBadgeProps {
  language?: string | null;
  iso?: string | null;
  confidence?: number | null;
  className?: string;
}

export function SupportLanguageBadge({
  language = "English",
  iso,
  confidence,
  className = "",
}: SupportLanguageBadgeProps) {
  const displayLang = language || "English";
  const family = getLanguageFamily(displayLang);

  // Color coding matching Indian Futurist tricolor theme
  let colorClasses = "text-slate-300 bg-white/5 border-white/15";
  let pulseDot = "bg-slate-400";

  if (family === "indo-aryan") {
    // Saffron Aura
    colorClasses =
      "text-[#FFB066] bg-[#FF9933]/15 border-[#FF9933]/40 shadow-xs shadow-[#FF9933]/20";
    pulseDot = "bg-[#FF9933]";
  } else if (family === "rtl") {
    // Chakra Blue Aura
    colorClasses =
      "text-[#93C5FD] bg-[#1E3A8A]/35 border-[#3B82F6]/50 shadow-xs shadow-blue-500/25";
    pulseDot = "bg-[#3B82F6]";
  } else if (family === "cjk") {
    // India Green Aura
    colorClasses =
      "text-[#6EE7B7] bg-[#10B981]/15 border-[#10B981]/40 shadow-xs shadow-emerald-500/20";
    pulseDot = "bg-[#10B981]";
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border backdrop-blur-md transition-all duration-200 ${colorClasses} ${className}`}
      title={`Language: ${displayLang}${iso ? ` (${iso})` : ""}${
        confidence ? ` • ${confidence}% Confidence` : ""
      }`}
    >
      <Globe className="w-3 h-3 flex-shrink-0 animate-spin-slow opacity-85" />
      <span className="font-semibold tracking-tight">
        {displayLang}
        {iso && <span className="opacity-70 font-mono text-[9px] ml-1 uppercase">[{iso}]</span>}
      </span>

      <span className="flex h-1.5 w-1.5 relative ml-0.5">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pulseDot} opacity-75`}
        />
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${pulseDot}`} />
      </span>

      {confidence !== undefined && confidence !== null && confidence > 0 && (
        <span className="text-[10px] font-mono opacity-80 pl-1 border-l border-white/15">
          {confidence}%
        </span>
      )}
    </div>
  );
}
