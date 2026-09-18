"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Package, RotateCcw, Headphones } from "lucide-react";

interface SuggestedPromptsProps {
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
}

const PROMPT_CHIPS = [
  {
    id: "track",
    icon: Package,
    label: "Track my order",
    text: "Hi, I would like to track the real-time shipping status of my order.",
    accent: "hover:border-[#3B82F6]/60 hover:shadow-blue-500/20",
    iconColor: "text-[#60A5FA]",
  },
  {
    id: "refund",
    icon: RotateCcw,
    label: "Request a refund",
    text: "I need assistance processing a refund for an unfulfilled transaction.",
    accent: "hover:border-[#FF9933]/60 hover:shadow-[#FF9933]/20",
    iconColor: "text-[#FF9933]",
  },
  {
    id: "human",
    icon: Headphones,
    label: "Talk to human agent",
    text: "Please connect me directly with a Tier-2 operations human support agent.",
    accent: "hover:border-[#10B981]/60 hover:shadow-emerald-500/20",
    iconColor: "text-[#34D399]",
  },
];

export function SuggestedPrompts({ onSelectPrompt, disabled = false }: SuggestedPromptsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="my-4 p-4 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-xl space-y-3"
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
        <Sparkles className="w-3.5 h-3.5 text-[#FF9933] animate-pulse" />
        <span className="tracking-wide uppercase text-[11px] text-slate-400">
          Suggested Inquiries
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {PROMPT_CHIPS.map((chip) => {
          const Icon = chip.icon;
          return (
            <button
              key={chip.id}
              disabled={disabled}
              onClick={() => onSelectPrompt(chip.text)}
              className={`flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-left transition-all duration-200 active:scale-98 shadow-sm ${chip.accent} disabled:opacity-50 cursor-pointer group`}
            >
              <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition flex-shrink-0">
                <Icon className={`w-4 h-4 ${chip.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white group-hover:text-slate-100 truncate">
                  {chip.label}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Click to inquire
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
