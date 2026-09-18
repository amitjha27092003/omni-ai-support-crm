"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  ShieldCheck,
  Languages,
  ChevronDown,
  Sparkles,
  Bot,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { SUPPORTED_LANGUAGES, isRTL } from "@/lib/languageDetection";
import { MeshBackground } from "@/components/support/MeshBackground";
import { ChatBubble, type MessageItem } from "@/components/support/ChatBubble";
import { TypingIndicator } from "@/components/support/TypingIndicator";
import { SuggestedPrompts } from "@/components/support/SuggestedPrompts";
import { ChatInput } from "@/components/support/ChatInput";

export default function SupportPortalPage() {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "msg-welcome",
      sender: "ai",
      text: "Namaste & Welcome to OmniAI Global Support! You can speak to us in any language — Hindi, Hinglish, Arabic, Spanish, French, German, Japanese, and more. How can we assist you today?",
      translation:
        "Namaste & Welcome to OmniAI Global Support! You can speak to us in any language — Hindi, Hinglish, Arabic, Spanish, French, German, Japanese, and more. How can we assist you today?",
      detectedLanguage: "English",
      detectedLanguageIso: "en",
      isRTL: false,
      confidenceScore: 98,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("auto");
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [customerName, setCustomerName] = useState("Customer");
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);
  const [ticketStatus, setTicketStatus] = useState<string>("Open");
  const [sessionId] = useState(() => {
    // Standard RFC4122 v4 UUID string
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  });
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const realtimeChannelRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Subscribe to Supabase Realtime for this ticket once created
  const subscribeToTicketRealtime = useCallback((ticketId: string) => {
    if (!ticketId || realtimeChannelRef.current) return;

    console.log(`[Support Realtime] Subscribing to ticket_messages & ticket updates for: ${ticketId}`);

    const channel = supabase
      .channel(`support-ticket-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ticket_messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          console.log("[Support Realtime] New message event:", payload);
          const newMsg = payload.new;
          if (newMsg && newMsg.sender === "agent") {
            const agentMsg: MessageItem = {
              id: newMsg.id || `agent-${Date.now()}`,
              sender: "agent",
              text: newMsg.content,
              detectedLanguage: newMsg.language || "English",
              detectedLanguageIso: newMsg.language || "en",
              timestamp: new Date(newMsg.created_at || Date.now()).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            };

            setMessages((prev) => {
              if (prev.some((m) => m.id === agentMsg.id || (m.text === agentMsg.text && m.sender === "agent"))) {
                return prev;
              }
              return [...prev, agentMsg];
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "operational_tickets",
          filter: `id=eq.${ticketId}`,
        },
        (payload) => {
          console.log("[Support Realtime] Ticket update event:", payload);
          if (payload.new?.status) {
            setTicketStatus(payload.new.status);
          }
        }
      )
      .subscribe((status) => {
        console.log(`[Support Realtime] Channel status: ${status}`);
      });

    realtimeChannelRef.current = channel;
  }, []);

  // Cleanup realtime subscription on unmount
  useEffect(() => {
    return () => {
      if (realtimeChannelRef.current) {
        console.log("[Support Realtime] Cleaning up channel");
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, []);

  const handleSend = async (textToSend?: string) => {
    const rawText = (textToSend !== undefined ? textToSend : input).trim();
    if (!rawText || isLoading) return;

    const userIsRtl = isRTL(rawText);
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMessage: MessageItem = {
      id: `cust-${Date.now()}`,
      sender: "customer",
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
          ticketId: currentTicketId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.ticketId && !currentTicketId) {
          setCurrentTicketId(data.ticketId);
          subscribeToTicketRealtime(data.ticketId);
        }

        const botMessage: MessageItem = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: data.reply || "Thank you for reaching out. We have logged your request.",
          translation: data.english_translation || data.reply_english,
          detectedLanguage: data.detected_language || "English",
          detectedLanguageIso: data.detected_language_iso || "en",
          isRTL: data.is_rtl ?? isRTL(data.reply),
          confidenceScore: data.confidence_score || 94,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
          id: `err-${Date.now()}`,
          sender: "ai",
          text: `⚠️ ${errorMsg}. Our support desk has been alerted.`,
          isRTL: false,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-slate-100 flex flex-col relative selection:bg-[#FF9933]/30 selection:text-white font-sans antialiased">
      {/* Animated Cinematic Tricolor Mesh Background */}
      <MeshBackground />

      {/* Standalone Public Header (No Operations Center button) */}
      <header className="sticky top-0 z-40 bg-[#0B0C12]/80 backdrop-blur-2xl border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Brand + Chakra Icon */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl p-0.5 bg-gradient-to-tr from-[#FF9933] via-[#3B82F6] to-[#10B981] shadow-lg shadow-[#FF9933]/25 flex items-center justify-center">
                <div className="w-full h-full bg-[#0B0C12] rounded-[14px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF9933] animate-pulse" />
                </div>
              </div>
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#FF9933] via-[#1E3A8A] to-[#10B981] opacity-35 blur-md -z-10" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  <span className="bg-gradient-to-r from-[#FF9933] via-white to-[#10B981] bg-clip-text text-transparent">
                    OmniAI
                  </span>
                  <span>Global Support</span>
                </h1>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                <span>Gemini 2.5 Multilingual Gateway</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">Live 24/7</span>
                {currentTicketId && (
                  <>
                    <span>•</span>
                    <span className="text-slate-500">Ticket #{currentTicketId.slice(0, 8)}</span>
                    <span className="text-blue-400 font-semibold">({ticketStatus})</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Standalone Language Selector */}
          <div className="relative">
            <button
              onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
              className="flex items-center gap-2 text-xs bg-white/5 hover:bg-white/10 border border-white/15 px-3 py-1.5 rounded-xl transition text-slate-200 cursor-pointer min-h-[40px]"
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
                    className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto z-50 bg-[#12131C]/95 border border-white/15 rounded-2xl shadow-2xl p-2 space-y-1 backdrop-blur-2xl"
                  >
                    <div className="px-2.5 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-white/10 flex items-center justify-between">
                      <span>Preferred Response Language</span>
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
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition text-left cursor-pointer ${
                            isSelected
                              ? "bg-[#FF9933]/20 text-[#FFB066] border border-[#FF9933]/40 font-semibold"
                              : "text-slate-300 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{lang.nativeName}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {lang.name}
                            </span>
                          </div>
                          {lang.isRTL && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
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
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-4 flex flex-col min-h-0">
        {/* Zero-Knowledge PII Masking Banner */}
        <div className="mb-3 bg-gradient-to-r from-[#FF9933]/15 via-[#1E3A8A]/20 to-[#138808]/15 border border-white/15 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-slate-300 text-xs">
              Zero-Knowledge PII Masking active • Chat securely connected to Supabase Realtime
            </span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-slate-400 text-[11px] hidden xs:inline">Your Name:</span>
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/15 rounded-xl px-2.5 py-1 focus-within:border-[#FF9933]">
              <User className="w-3 h-3 text-slate-400" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your name..."
                className="bg-transparent text-xs text-white focus:outline-none w-24 sm:w-32"
              />
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1 custom-scrollbar">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}

          {/* Typing Indicator */}
          {isLoading && <TypingIndicator />}

          {/* Suggested Prompts (when only welcome message is shown) */}
          {messages.length <= 1 && (
            <SuggestedPrompts
              onSelectPrompt={(text) => handleSend(text)}
              disabled={isLoading}
            />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Sticky Chat Input Bar */}
        <ChatInput
          input={input}
          onChangeInput={setInput}
          onSend={() => handleSend()}
          isLoading={isLoading}
          targetLanguageName={selectedLangObj.nativeName}
        />
      </main>
    </div>
  );
}
