"use client";

import React, { useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { isRTL } from "@/lib/languageDetection";

interface ChatInputProps {
  input: string;
  onChangeInput: (val: string) => void;
  onSend: () => void;
  isLoading: boolean;
  targetLanguageName?: string;
}

export function ChatInput({
  input,
  onChangeInput,
  onSend,
  isLoading,
  targetLanguageName = "Auto (Customer Native)",
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputIsRTL = isRTL(input);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend();
    }
  };

  return (
    <div className="sticky bottom-0 z-30 pb-3 pt-2 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/90 to-transparent backdrop-blur-md">
      <form
        onSubmit={handleSubmit}
        className="relative rounded-2xl bg-[#0E0F17]/95 border border-white/20 focus-within:border-[#FF9933] shadow-2xl p-2 transition duration-200 overflow-hidden group"
      >
        {/* Tricolor top hairline accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF9933] via-[#3B82F6] to-[#10B981] opacity-70 group-focus-within:opacity-100 transition-opacity" />

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            dir={inputIsRTL ? "rtl" : "ltr"}
            value={input}
            onChange={(e) => onChangeInput(e.target.value)}
            placeholder="Type in Hindi, Hinglish, Arabic, Spanish, English, French..."
            disabled={isLoading}
            className={`w-full bg-transparent text-sm text-white placeholder:text-slate-500 px-3 py-2.5 focus:outline-none disabled:opacity-50 min-h-[44px] ${
              inputIsRTL ? "text-right font-sans" : "text-left font-sans"
            }`}
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="relative px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF9933] via-[#FF8008] to-[#10B981] hover:from-[#FFA54B] hover:to-[#13A366] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#FF9933]/30 hover:shadow-[#FF9933]/50 disabled:opacity-40 disabled:cursor-not-allowed transition transform active:scale-95 flex-shrink-0 min-h-[44px] min-w-[44px] justify-center overflow-hidden cursor-pointer"
          >
            {/* Shimmer sweep effect */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
            <span className="relative z-10 hidden xs:inline">Send</span>
            <Send className="w-3.5 h-3.5 relative z-10" />
          </button>
        </div>

        {/* Bottom micro-telemetry status line */}
        <div className="mt-1.5 pt-1.5 border-t border-white/5 px-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF9933] animate-pulse" />
            <span className="truncate">Auto Script Detection (Devanagari, RTL, CJK, Latin)</span>
          </span>
          <span className="text-slate-400 shrink-0 ml-2">
            Target: <strong className="text-slate-200">{targetLanguageName}</strong>
          </span>
        </div>
      </form>
    </div>
  );
}
