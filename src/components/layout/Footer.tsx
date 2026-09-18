"use client";

import React from "react";
import { Bot, Shield, Sparkles, Activity } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full glass-panel border-t border-white/10 dark:border-white/[0.08] tricolor-hairline-top py-6 px-4 sm:px-8 mt-12 relative z-20">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#FF9933] to-[#10B981] p-0.5 flex items-center justify-center shadow-xs">
            <div className="w-full h-full bg-[#0A0A0F] rounded-[5px] flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-[#FF9933]" />
            </div>
          </div>
          <span className="font-semibold text-slate-300">
            OmniAI Ops Dashboard
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-[11px] text-slate-400">
            Indian-Futurist Intelligence Infrastructure
          </span>
        </div>

        {/* Center: Tricolor Indicator Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-[#FF9933]" />
          <span className="w-2 h-2 rounded-full bg-white" />
          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span className="w-2 h-2 rounded-full bg-[#1E3A8A]" />
          <span className="text-slate-300 font-mono ml-1">TRICOLOR AURORA CORE</span>
        </div>

        {/* Right: Security & Uptime */}
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Supabase Live Sync: Connected
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Gemini 2.5 Flash</span>
        </div>
      </div>
    </footer>
  );
}
