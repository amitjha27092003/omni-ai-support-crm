"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Search, Check, ChevronDown, Sparkles } from "lucide-react";
import { SUPPORTED_LANGUAGES, type LanguageMeta } from "@/lib/languageDetection";

interface LanguageSelectorProps {
  selectedLanguage: string; // code or name e.g. "auto" or "Hindi"
  onSelectLanguage: (language: LanguageMeta) => void;
  disabled?: boolean;
  className?: string;
}

export function LanguageSelector({
  selectedLanguage,
  onSelectLanguage,
  disabled = false,
  className = "",
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Find active language meta
  const currentLang =
    SUPPORTED_LANGUAGES.find(
      (l) =>
        l.code.toLowerCase() === selectedLanguage.toLowerCase() ||
        l.name.toLowerCase() === selectedLanguage.toLowerCase()
    ) || SUPPORTED_LANGUAGES[0];

  // Filter languages by search query
  const filteredLanguages = SUPPORTED_LANGUAGES.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q) ||
      l.region.toLowerCase().includes(q)
    );
  });

  // Group by region
  const regions = ["Global", "Indian", "Middle Eastern", "European", "Asian"] as const;

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-xl font-medium border transition-all duration-200 active:scale-95 disabled:opacity-50 min-h-[32px] ${
          isOpen
            ? "bg-white/10 border-[#3B82F6]/60 text-white shadow-[0_0_12px_rgba(59,130,246,0.25)]"
            : "bg-white/[0.03] border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.08]"
        }`}
        title="Choose reply language (Auto-detect matches customer native)"
      >
        <Globe className="w-3.5 h-3.5 text-[#3B82F6]" />
        <span className="font-semibold text-[11px] truncate max-w-[130px]">
          {currentLang.code === "auto" ? "Auto (Native)" : currentLang.name}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 bottom-full mb-2 w-64 sm:w-72 rounded-2xl glass-panel border border-white/15 dark:border-white/10 shadow-2xl p-2.5 z-50 backdrop-blur-2xl bg-[#0F101A]/95 text-slate-200"
          >
            {/* Search Input */}
            <div className="relative mb-2">
              <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                autoFocus
                placeholder="Search language or script..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#3B82F6]/60"
              />
            </div>

            {/* Language Groups */}
            <div className="max-h-60 overflow-y-auto space-y-3 custom-scrollbar pr-1">
              {regions.map((region) => {
                const groupItems = filteredLanguages.filter((l) => l.region === region);
                if (groupItems.length === 0) return null;

                return (
                  <div key={region} className="space-y-1">
                    <div className="text-[9px] uppercase font-bold tracking-wider text-slate-400 px-2 pt-1">
                      {region === "Indian"
                        ? "🇮🇳 Indian Languages & Hinglish"
                        : region === "Middle Eastern"
                        ? "🌍 Middle Eastern (RTL)"
                        : region === "Asian"
                        ? "🌏 Asian (CJK)"
                        : region === "European"
                        ? "🇪🇺 European"
                        : "🌐 Universal"}
                    </div>

                    <div className="space-y-0.5">
                      {groupItems.map((lang) => {
                        const isSelected =
                          lang.code.toLowerCase() === currentLang.code.toLowerCase();

                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => {
                              onSelectLanguage(lang);
                              setIsOpen(false);
                              setSearchQuery("");
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left ${
                              isSelected
                                ? "bg-gradient-to-r from-[#FF9933]/25 via-[#3B82F6]/20 to-[#10B981]/20 border border-white/20 text-white font-bold"
                                : "hover:bg-white/5 text-slate-300 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {lang.code === "auto" ? (
                                <Sparkles className="w-3 h-3 text-[#FF9933]" />
                              ) : (
                                <span className="font-mono text-[9px] uppercase opacity-60 bg-white/10 px-1 py-0.2 rounded">
                                  {lang.code}
                                </span>
                              )}
                              <span className="truncate">{lang.name}</span>
                              {lang.nativeName !== lang.name && (
                                <span className="text-[10px] text-slate-400 truncate font-normal">
                                  ({lang.nativeName})
                                </span>
                              )}
                            </div>

                            {isSelected && <Check className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {filteredLanguages.length === 0 && (
                <div className="py-4 text-center text-xs text-slate-400">
                  No matching language found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
