"use client";

import React from "react";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="flex items-end gap-2.5 my-2"
    >
      <div className="w-8 h-8 rounded-xl bg-[#FF9933]/15 border border-[#FF9933]/30 flex items-center justify-center flex-shrink-0 shadow-xs shadow-[#FF9933]/20">
        <Bot className="w-4 h-4 text-[#FF9933]" />
      </div>

      <div className="bg-white/[0.05] border border-white/15 backdrop-blur-xl rounded-2xl rounded-tl-xs px-4 py-3 shadow-lg flex items-center gap-2">
        <span className="text-xs text-slate-300 font-medium mr-1.5 hidden sm:inline">
          Gemini 2.5 is thinking
        </span>

        <div className="flex items-center gap-1.5">
          {/* Dot 1: Saffron */}
          <motion.span
            animate={{
              y: [0, -6, 0],
              scale: [1, 1.25, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0,
            }}
            className="w-2 h-2 rounded-full bg-[#FF9933] shadow-[0_0_8px_#FF9933]"
          />

          {/* Dot 2: White */}
          <motion.span
            animate={{
              y: [0, -6, 0],
              scale: [1, 1.25, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.2,
            }}
            className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_white]"
          />

          {/* Dot 3: Green */}
          <motion.span
            animate={{
              y: [0, -6, 0],
              scale: [1, 1.25, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.4,
            }}
            className="w-2 h-2 rounded-full bg-[#138808] shadow-[0_0_8px_#138808]"
          />
        </div>
      </div>
    </motion.div>
  );
}
