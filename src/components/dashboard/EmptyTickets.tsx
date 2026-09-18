"use client";

import React from "react";
import { Send, Bot, Sparkles, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

export function EmptyTickets() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center select-none">
      {/* Animated icon orb */}
      <motion.div
        animate={{
          scale: [1, 1.06, 1],
          rotate: [0, 4, -4, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative mb-5"
      >
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#FF9933]/20 via-[#3B82F6]/20 to-[#10B981]/20 p-0.5 shadow-xl shadow-[#FF9933]/10">
          <div className="w-full h-full bg-[#0A0A0F] rounded-[22px] flex items-center justify-center border border-white/10">
            <Send className="w-7 h-7 text-[#FF9933]" />
          </div>
        </div>
        {/* Pulsing ring */}
        <span className="absolute -inset-2 rounded-3xl border border-[#3B82F6]/30 animate-pulse pointer-events-none" />
      </motion.div>

      <h3 className="text-sm sm:text-base font-bold text-white mb-2 tracking-tight">
        Awaiting Inbound Transmissions
      </h3>

      <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-5">
        No tickets yet. Send a message to your <span className="text-[#38BDF8] font-semibold">Telegram bot</span> to see it appear here live in real-time.
      </p>

      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-300 backdrop-blur-md">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
        </span>
        <span>Telegram Webhook Ingestion: <strong className="text-[#10B981]">Listening</strong></span>
      </div>
    </div>
  );
}
