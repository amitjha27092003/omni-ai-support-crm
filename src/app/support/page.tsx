"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Globe,
  ArrowLeft,
  ShieldCheck,
  Languages,
  CheckCircle2,
  ChevronDown,
  Clock,
} from "lucide-react";
import { LanguageBadge } from "@/components/dashboard/LanguageBadge";
import { isRTL, SUPPORTED_LANGUAGES } from "@/lib/languageDetection";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  translation?: string;
  detectedLanguage?: string;
  detectedLanguageIso?: string;
  isRTL?: boolean;
  confidenceScore?: number;
  timestamp: string;
  showTranslation?: boolean;
}

const STARTER_PROMPTS = [
  {
    label: "🇮🇳 Hindi",
    text: "नमस्ते, मुझे मेरे आर्डर का स्टेटस जानना है। कृपया सहायता करें।",
  },
  {
    label: "🌐 English",
    text: "Hi, I need help with an urgent refund on order #8921.",
  },
  {
    label: "🇸🇦 Arabic",
    text: "مرحباً، أواجه مشكلة في الدفع وأحتاج مساعدة فورية.",
  },
  {
    label: "🇪🇸 Spanish",
    text: "Hola, me gustaría saber cómo actualizar mi dirección de entrega.",
  },
  {
    label: "🇮🇳 Hinglish",
    text: "Bhai mera refund abhi tak nahi aaya, transaction status check kardo please.",
  },
  {
    label: "🇯🇵 Japanese",
    text: "こんにちは、注文の配送状況を確認したいのですが手伝っていただけますか？",
  },
];

export default function SupportPortalPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      sender: "bot",
      text: "Welcome to OmniAI Global Support! You can speak to us in any language — Hindi, Hinglish, Arabic, Spanish, English, French, and more. How can we assist you today?",
      translation:
        "Welcome to OmniAI Global Support! You can speak to us in any language — Hindi, Hinglish, Arabic, Spanish, English, French, and more. How can we assist you today?",
      detectedLanguage: "English",
      detectedLanguageIso: "en",
      isRTL: false,
      confidenceScore: 99,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("auto");
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [customerName, setCustomerName] = useState("Global Visitor");
  const [sessionId] = useState(() => `web_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const rawText = (textToSend !== undefined ? textToSend : input).trim();
    if (!rawText || isLoading) return;

    const userIsRtl = isRTL(rawText);
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: rawText,
      isRTL: userIsRtl,
      timestamp: nowTime,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (textToSend === undefined) {
      setInput("");
    }
    setIsLoading(true);

    try {
      const res = await fetch("/api/webchat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: rawText,
          customerName: customerName.trim() || "Web Visitor",
          customerHandle: `@${(customerName.trim() || "visitor").toLowerCase().replace(/\s+/g, "_")}`,
          targetLanguage: selectedLanguage,
          sessionId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: data.reply || "Thank you for reaching out. We have logged your request.",
          translation: data.english_translation || data.reply_english,
          detectedLanguage: data.detected_language || "English",
          detectedLanguageIso: data.detected_language_iso || "en",
          isRTL: data.is_rtl ?? isRTL(data.reply),
          confidenceScore: data.confidence_score || 95,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          showTranslation: false,
        };

        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error(data.error || "Failed to reach AI support assistant");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Error contacting support";
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: "bot",
          text: `⚠️ ${errorMsg}. Our support desk has been alerted.`,
          isRTL: false,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const toggleTranslation = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, showTranslation: !msg.showTranslation } : msg
      )
    );
  };

  const selectedLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  const currentInputIsRTL = isRTL(input);

  return (
    <div className="min-h-screen bg-[#07070A] text-slate-100 flex flex-col selection:bg-[#FF9933]/30 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0B0C12]/90 backdrop-blur-xl border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition"
              title="Return to OmniAI Command Center"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Operations Center</span>
            </Link>

            <div className="h-4 w-px bg-white/10" />

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF9933]/20 via-[#1E3A8A]/30 to-[#138808]/20 border border-[#FF9933]/40 flex items-center justify-center shadow-xs shadow-[#FF9933]/20">
                <Sparkles className="w-4 h-4 text-[#FF9933]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-semibold tracking-tight text-white">
                    OmniAI Global Support
                  </h1>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <span>Gemini 2.5 Multilingual Gateway</span>
                  <span>•</span>
                  <span className="text-emerald-400">Live 24/7</span>
                </p>
              </div>
            </div>
          </div>

          {/* Target Language Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
              className="flex items-center gap-2 text-xs bg-[#12131A] hover:bg-[#1A1B24] border border-white/15 px-3 py-1.5 rounded-xl transition text-slate-200"
            >
              <Globe className="w-3.5 h-3.5 text-[#FF9933]" />
              <span className="hidden sm:inline text-slate-400">Language:</span>
              <span className="font-semibold text-white">
                {selectedLangObj.nativeName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <AnimatePresence>
              {isLanguageMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsLanguageMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto z-50 bg-[#12131C] border border-white/15 rounded-xl shadow-2xl p-1.5 space-y-1 backdrop-blur-xl"
                  >
                    <div className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-white/10 flex items-center justify-between">
                      <span>Select Preferred Language</span>
                      <Languages className="w-3 h-3 text-[#FF9933]" />
                    </div>
                    {SUPPORTED_LANGUAGES.map((lang) => {
                      const isSelected = selectedLanguage === lang.code;
                      return (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setSelectedLanguage(lang.code);
                            setIsLanguageMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left ${
                            isSelected
                              ? "bg-[#FF9933]/15 text-[#FF9933] border border-[#FF9933]/30 font-semibold"
                              : "text-slate-300 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <div className="flex flex-col">
                            <span>{lang.nativeName}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {lang.name}
                            </span>
                          </div>
                          {lang.isRTL && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              RTL
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Support Conversation Box */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        {/* Visitor Info Banner */}
        <div className="mb-4 bg-gradient-to-r from-[#FF9933]/10 via-[#1E3A8A]/15 to-[#138808]/10 border border-white/10 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">
              Zero-Knowledge PII Masking active • Chat is securely connected to Supabase Realtime
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Your Name:</span>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Your name..."
              className="bg-black/40 border border-white/15 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#FF9933]"
            />
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1">
          {messages.map((msg) => {
            const isBot = msg.sender === "bot";
            const textDirection = msg.isRTL ? "rtl" : "ltr";
            const alignment = msg.isRTL ? "text-right" : "text-left";

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${isBot ? "justify-start" : "justify-end"}`}
              >
                {isBot && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF9933] to-[#FF6600] flex items-center justify-center flex-shrink-0 shadow-md shadow-[#FF9933]/20 mt-1">
                    <Bot className="w-4 h-4 text-black" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-xl backdrop-blur-md ${
                    isBot
                      ? "bg-[#10121A] border border-white/15 text-slate-100"
                      : "bg-gradient-to-r from-[#FF9933] via-[#FF851B] to-[#FF7700] text-black font-medium border border-white/20"
                  }`}
                >
                  {/* Header inside bubble for bot */}
                  {isBot && (
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-1.5 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1">
                          OmniAI Assistant
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" />
                        </span>
                        {msg.detectedLanguage && (
                          <LanguageBadge
                            language={msg.detectedLanguage}
                            iso={msg.detectedLanguageIso}
                            isAutoDetected={false}
                          />
                        )}
                      </div>
                      {msg.confidenceScore && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                          {msg.confidenceScore}% Confidence
                        </span>
                      )}
                    </div>
                  )}

                  {/* Message content */}
                  <div
                    dir={textDirection}
                    className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${alignment} ${
                      !isBot ? "font-semibold" : ""
                    }`}
                  >
                    {msg.showTranslation && msg.translation ? msg.translation : msg.text}
                  </div>

                  {/* Translation toggle if available and different */}
                  {isBot && msg.translation && msg.translation !== msg.text && (
                    <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                      <button
                        onClick={() => toggleTranslation(msg.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-[#FF9933] hover:text-[#FFAA55] transition font-medium"
                      >
                        <Globe className="w-3 h-3" />
                        <span>
                          {msg.showTranslation
                            ? "Show Native Script"
                            : "Translate to English"}
                        </span>
                      </button>

                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-2.5 h-2.5" />
                        {msg.timestamp}
                      </span>
                    </div>
                  )}

                  {!isBot && (
                    <div className="mt-1 text-right text-[10px] text-black/70 font-mono">
                      {msg.timestamp}
                    </div>
                  )}
                </div>

                {!isBot && (
                  <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Typing / Processing indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 items-center"
            >
              <div className="w-8 h-8 rounded-xl bg-[#FF9933]/20 border border-[#FF9933]/40 flex items-center justify-center flex-shrink-0 animate-pulse">
                <Bot className="w-4 h-4 text-[#FF9933]" />
              </div>
              <div className="bg-[#12131C] border border-white/15 rounded-2xl px-4 py-3 flex items-center gap-2 text-xs text-slate-300">
                <span className="inline-block w-2 h-2 rounded-full bg-[#FF9933] animate-bounce" />
                <span
                  className="inline-block w-2 h-2 rounded-full bg-white animate-bounce"
                  style={{ animationDelay: "0.15s" }}
                />
                <span
                  className="inline-block w-2 h-2 rounded-full bg-[#138808] animate-bounce"
                  style={{ animationDelay: "0.3s" }}
                />
                <span className="ml-1 text-slate-400">
                  Gemini 2.5 is synthesizing response...
                </span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Starter Prompt Chips */}
        {messages.length <= 2 && (
          <div className="mb-4">
            <p className="text-[11px] text-slate-400 font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#FF9933]" />
              <span>Try Asking in Any Script / Language:</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTER_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt.text)}
                  className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FF9933]/40 px-3 py-1.5 rounded-xl text-slate-200 transition text-left flex items-center gap-1.5"
                >
                  <span className="font-semibold">{prompt.label}:</span>
                  <span className="opacity-80 truncate max-w-[200px] sm:max-w-[280px]">
                    {prompt.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative bg-[#0F1018] border border-white/20 focus-within:border-[#FF9933] rounded-2xl p-2 shadow-2xl transition duration-200"
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              dir={currentInputIsRTL ? "rtl" : "ltr"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type in Hindi, Hinglish, Arabic, Spanish, English, French..."
              disabled={isLoading}
              className={`w-full bg-transparent text-sm text-white placeholder:text-slate-500 px-3 py-2 focus:outline-none disabled:opacity-50 ${
                currentInputIsRTL ? "text-right" : "text-left"
              }`}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF9933] to-[#FF8000] text-black font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-[#FF9933]/30 hover:shadow-[#FF9933]/50 disabled:opacity-40 disabled:cursor-not-allowed transition transform active:scale-95 flex-shrink-0"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-1.5 pt-1.5 border-t border-white/5 px-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF9933]" />
              Auto Script Detection (Devanagari, RTL, CJK, Latin)
            </span>
            <span>Target: {selectedLangObj.name}</span>
          </div>
        </form>
      </main>
    </div>
  );
}
