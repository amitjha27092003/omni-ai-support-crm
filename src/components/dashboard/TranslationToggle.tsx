"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Languages, Sparkles } from "lucide-react";

interface TranslationToggleProps {
  showTranslation: boolean;
  onToggle: (showTranslation: boolean) => void;
  hasTranslation: boolean;
  detectedLanguage?: string | null;
  className?: string;
}

export function TranslationToggle({
  showTranslation,
  onToggle,
  hasTranslation,
  detectedLanguage = "Customer Native",
  className = "",
}: TranslationToggleProps) {
  // Read initial preference from localStorage if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem("omni_trans_pref");
      if (stored !== null) {
        onToggle(stored === "true");
      }
    } catch {
      // Ignore localStorage read errors in private mode
    }
  }, []);

  const handleSelect = (val: boolean) => {
    onToggle(val);
    try {
      localStorage.setItem("omni_trans_pref", String(val));
    } catch {
      // Ignore localStorage write errors
    }
  };

  const isEnglishNative =
    (detectedLanguage || "").toLowerCase() === "english" ||
    (detectedLanguage || "").toLowerCase() === "en";

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md ${className}`}
    >
      <button
        type="button"
        onClick={() => handleSelect(false)}
        className={`relative px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-200 outline-none flex items-center gap-1.5 ${
          !showTranslation
            ? "text-white shadow-xs"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        {!showTranslation && (
          <motion.div
            layoutId="transToggleActive"
            className="absolute inset-0 bg-gradient-to-r from-[#FF9933]/25 to-[#FF8008]/20 border border-[#FF9933]/50 rounded-lg -z-10 shadow-[0_0_10px_rgba(255,153,51,0.2)]"
            transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
          />
        )}
        <Languages className="w-3 h-3 text-[#FF9933]" />
        <span>Show Original</span>
      </button>

      <button
        type="button"
        onClick={() => handleSelect(true)}
        disabled={isEnglishNative && !hasTranslation}
        className={`relative px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-200 outline-none flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
          showTranslation
            ? "text-white shadow-xs"
            : "text-slate-400 hover:text-slate-200"
        }`}
        title={
          isEnglishNative && !hasTranslation
            ? "Already in English"
            : "Translate customer transmission to English"
        }
      >
        {showTranslation && (
          <motion.div
            layoutId="transToggleActive"
            className="absolute inset-0 bg-gradient-to-r from-[#3B82F6]/25 to-[#10B981]/20 border border-[#3B82F6]/50 rounded-lg -z-10 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
            transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
          />
        )}
        <Sparkles className="w-3 h-3 text-[#60A5FA]" />
        <span>Translate to English</span>
      </button>
    </div>
  );
}
