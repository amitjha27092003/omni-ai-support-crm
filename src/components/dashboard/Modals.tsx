"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Smartphone,
  BookOpen,
  Plus,
  Trash2,
  Terminal,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Send,
  Zap,
} from "lucide-react";
import { modalVariants } from "@/lib/animations";
import { GradientButton } from "@/components/ui/GradientButton";
import { type Ticket } from "./TicketsTable";

// ═══════════════════════════════════════════════════
// 1. MOBILE DISPATCH PREVIEW MODAL
// ═══════════════════════════════════════════════════

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  replyText: string;
}

export function PreviewModal({ isOpen, onClose, ticket, replyText }: PreviewModalProps) {
  if (!isOpen || !ticket) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-w-sm rounded-[36px] bg-[#0A0A0F] border-2 border-white/20 shadow-2xl p-4 overflow-hidden"
        >
          {/* Phone Speaker & Notch */}
          <div className="w-24 h-4 bg-white/10 rounded-full mx-auto mb-4" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Phone Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-white/10 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF9933] to-[#10B981] p-0.5">
              <div className="w-full h-full rounded-full bg-[#12131F] flex items-center justify-center text-xs font-bold text-white">
                {(ticket.customer_name || "TU").slice(0, 2).toUpperCase()}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                {ticket.customer_name || "Telegram User"}
              </div>
              <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {ticket.channel} Gateway {ticket.customer_handle ? `• ${ticket.customer_handle}` : ""}
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="py-6 px-2 space-y-4 min-h-[320px] max-h-[400px] overflow-y-auto custom-scrollbar">
            {/* Customer Message */}
            <div className="flex justify-start">
              <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-white/10 border border-white/10 p-3 text-xs text-slate-200">
                {ticket.sanitized_message || ticket.original_message || "Empty message"}
                <div className="text-[9px] text-slate-400 text-right mt-1">
                  {new Date(ticket.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>

            {/* AI Dispatch Response */}
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-[#1E3A8A]/90 to-[#2563EB]/90 border border-blue-400/30 p-3 text-xs text-white shadow-lg">
                <div className="flex items-center gap-1 text-[9px] text-blue-200 font-semibold mb-1">
                  <Zap className="w-2.5 h-2.5 text-[#FF9933] fill-current" /> OmniAI Dispatch
                </div>
                {replyText || ticket.ai_reply || ticket.suggested_reply || "No reply drafted yet."}
                <div className="text-[9px] text-blue-200/80 text-right mt-1">Just now • Delivered</div>
              </div>
            </div>
          </div>

          {/* Phone Bottom Home Bar */}
          <div className="w-32 h-1 bg-white/30 rounded-full mx-auto mt-3" />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════
// 2. GROUNDING KNOWLEDGE BASE MODAL
// ═══════════════════════════════════════════════════

export interface KBArticle {
  id: string;
  topic: string;
  content: string;
  active: boolean;
}

interface KBModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: KBArticle[];
  onAddArticle: (topic: string, content: string) => void;
  onDeleteArticle: (id: string) => void;
}

export function KBModal({
  isOpen,
  onClose,
  articles,
  onAddArticle,
  onDeleteArticle,
}: KBModalProps) {
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !content.trim()) return;
    onAddArticle(topic, content);
    setTopic("");
    setContent("");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-w-2xl rounded-3xl glass-panel border border-white/15 shadow-2xl p-6 sm:p-8 overflow-hidden tricolor-hairline-top"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Grounding Knowledge Base
                </h2>
                <p className="text-xs text-slate-400">
                  Defines factual boundary constraints for autonomous Gemini 2.5 resolutions
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* New Article Form */}
          <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-[#FF9933]" /> Add New Grounding Policy
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Topic (e.g. Invoicing SLA)"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF9933]/60"
              />
              <input
                type="text"
                placeholder="Policy constraint or rule content..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="sm:col-span-2 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF9933]/60"
              />
            </div>
            <div className="flex justify-end pt-1">
              <GradientButton variant="saffron" size="sm" type="submit" disabled={!topic || !content}>
                Save Policy
              </GradientButton>
            </div>
          </form>

          {/* Existing Articles */}
          <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar">
            {articles.map((art) => (
              <div
                key={art.id}
                className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-bold text-[#FFB066] mb-1">{art.topic}</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{art.content}</p>
                </div>
                <button
                  onClick={() => onDeleteArticle(art.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                  title="Remove Policy"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════
// 3. TELEMETRY TERMINAL DRAWER
// ═══════════════════════════════════════════════════

export interface AgentLog {
  id: string;
  time: string;
  level: "INFO" | "AGENT" | "DISPATCH";
  message: string;
}

interface TelemetryDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  logs: AgentLog[];
}

export function TelemetryDrawer({ isOpen, onToggle, logs }: TelemetryDrawerProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0F]/95 backdrop-blur-2xl border-t border-white/15 shadow-2xl transition-all duration-300">
      <div
        onClick={onToggle}
        className="px-6 py-2.5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
          <Terminal className="w-4 h-4 text-[#10B981]" />
          <span className="text-[#10B981] font-bold">Autonomous Core Telemetry</span>
          <span className="text-slate-400 text-[11px]">• Supabase Realtime: Active</span>
          <span className="text-slate-400 text-[11px]">• Gemini 2.5: Ready</span>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <span>{isOpen ? "Hide Telemetry" : "Open Live Agent Logs"}</span>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </div>

      {isOpen && (
        <div className="p-4 border-t border-white/10 font-mono text-[11px] space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar bg-black/60">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3">
              <span className="text-slate-500 select-none">[{log.time}]</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                  log.level === "AGENT"
                    ? "bg-[#FF9933]/20 text-[#FF9933] border-[#FF9933]/40"
                    : log.level === "DISPATCH"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-blue-500/20 text-blue-400 border-blue-500/40"
                }`}
              >
                {log.level}
              </span>
              <span className="text-slate-200">{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ToastNotification({
  message,
  isError = false,
}: {
  message: string | null;
  isError?: boolean;
}) {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`fixed bottom-14 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl glass-panel border text-white text-xs font-semibold shadow-2xl ${
        isError
          ? "border-rose-500/50 shadow-rose-500/25 text-rose-200"
          : "border-[#10B981]/40 shadow-emerald-500/20 text-white"
      }`}
    >
      {isError ? (
        <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
      ) : (
        <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0" />
      )}
      <span>{message}</span>
    </motion.div>
  );
}
