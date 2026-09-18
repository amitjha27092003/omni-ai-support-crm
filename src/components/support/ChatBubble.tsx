"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Globe, CheckCircle2, Clock } from "lucide-react";
import { SupportLanguageBadge } from "./LanguageBadge";
import { isRTL } from "@/lib/languageDetection";

export interface MessageItem {
  id: string;
  sender: "customer" | "ai" | "agent";
  text: string;
  translation?: string;
  detectedLanguage?: string;
  detectedLanguageIso?: string;
  isRTL?: boolean;
  confidenceScore?: number;
  timestamp: string;
}

interface ChatBubbleProps {
  message: MessageItem;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const [showTranslation, setShowTranslation] = useState(false);

  const isCustomer = message.sender === "customer";
  const isAgent = message.sender === "agent";

  // Check if text or language script is RTL
  const messageIsRTL =
    message.isRTL ??
    (isRTL(message.detectedLanguageIso || message.detectedLanguage || message.text));

  const textDirection = messageIsRTL ? "rtl" : "ltr";
  const textAlign = messageIsRTL ? "text-right" : "text-left";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
      className={`flex items-end gap-2.5 my-3 ${
        isCustomer
          ? messageIsRTL
            ? "justify-start flex-row-reverse"
            : "justify-end"
          : messageIsRTL
          ? "justify-end flex-row-reverse"
          : "justify-start"
      }`}
    >
      {/* Bot / Agent Avatar */}
      {!isCustomer && (
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mb-1 shadow-md ${
            isAgent
              ? "bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] text-white border border-blue-400/40"
              : "bg-gradient-to-br from-[#FF9933] to-[#FF6B00] text-black border border-[#FF9933]/50"
          }`}
        >
          {isAgent ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={`max-w-[86%] sm:max-w-[78%] p-4 sm:p-5 transition-all duration-200 ${
          isCustomer
            ? messageIsRTL
              ? "rounded-2xl rounded-tl-xs bg-gradient-to-br from-[#FF9933] via-[#FF8000] to-[#FF6B00] text-slate-950 font-medium shadow-lg shadow-[#FF9933]/25 border border-white/20"
              : "rounded-2xl rounded-tr-xs bg-gradient-to-br from-[#FF9933] via-[#FF8000] to-[#FF6B00] text-slate-950 font-medium shadow-lg shadow-[#FF9933]/25 border border-white/20"
            : messageIsRTL
            ? "rounded-2xl rounded-tr-xs bg-white/[0.05] backdrop-blur-xl border border-white/15 text-slate-100 shadow-xl relative overflow-hidden"
            : "rounded-2xl rounded-tl-xs bg-white/[0.05] backdrop-blur-xl border border-white/15 text-slate-100 shadow-xl relative overflow-hidden"
        }`}
      >
        {/* Subtle Tricolor hairline top border on AI bubbles */}
        {!isCustomer && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF9933]/40 via-[#3B82F6]/40 to-[#10B981]/40 opacity-70" />
        )}

        {/* AI / Agent Bubble Header */}
        {!isCustomer && (
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-tight flex items-center gap-1">
                {isAgent ? "Support Specialist" : "OmniAI Assistant"}
                <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" />
              </span>
              {isAgent && (
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Human Agent
                </span>
              )}
            </div>

            {/* Language Badge with Confidence */}
            {message.detectedLanguage && (
              <SupportLanguageBadge
                language={message.detectedLanguage}
                iso={message.detectedLanguageIso}
                confidence={message.confidenceScore}
              />
            )}
          </div>
        )}

        {/* Message Body */}
        <div
          dir={showTranslation ? "ltr" : textDirection}
          className={`text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words ${
            showTranslation ? "text-left" : textAlign
          }`}
        >
          <AnimatePresence mode="wait">
            {showTranslation && message.translation ? (
              <motion.div
                key="translation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-1"
              >
                <div className="text-[11px] font-mono text-[#60A5FA] flex items-center gap-1">
                  <span>🇬🇧 English Translation:</span>
                </div>
                <p>{message.translation}</p>
              </motion.div>
            ) : (
              <motion.div
                key="original"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Translation Toggle & Timestamp Footer */}
        <div
          className={`mt-2.5 pt-1.5 flex items-center justify-between text-xs gap-3 ${
            !isCustomer ? "border-t border-white/10" : "border-t border-black/10"
          }`}
        >
          {!isCustomer && message.translation && message.translation !== message.text ? (
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className="inline-flex items-center gap-1 text-xs text-[#FF9933] hover:text-[#FFAA55] font-semibold transition active:scale-95 cursor-pointer"
            >
              <Globe className="w-3 h-3" />
              <span>{showTranslation ? "Show Original Script" : "Translate to English"}</span>
            </button>
          ) : (
            <span />
          )}

          <span
            className={`text-[10px] font-mono flex items-center gap-1 shrink-0 ${
              isCustomer ? "text-slate-900/80" : "text-slate-400"
            }`}
          >
            <Clock className="w-2.5 h-2.5" />
            {message.timestamp}
          </span>
        </div>
      </div>

      {/* Customer Avatar */}
      {isCustomer && (
        <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 mb-1">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.div>
  );
}
