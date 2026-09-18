"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  AlertTriangle,
  BookOpen,
  Zap,
  Share2,
  CheckCircle2,
  Clock,
  Smartphone,
  Cpu,
  Tag,
} from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import { StatusPill } from "@/components/ui/StatusPill";
import { type Ticket } from "@/hooks/useTickets";

interface AIInboxProps {
  ticket: Ticket | null;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  onSendReply: () => void;
  onEscalate: () => void;
  onPreviewDispatch?: () => void;
  isSending?: boolean;
}

export function AIInbox({
  ticket,
  replyText,
  onReplyTextChange,
  onSendReply,
  onEscalate,
  onPreviewDispatch,
  isSending = false,
}: AIInboxProps) {
  const [activeTab, setActiveTab] = useState<"reply" | "audit">("reply");

  if (!ticket) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 glass-panel rounded-2xl border border-white/10 dark:border-white/[0.08] text-center min-h-[450px]">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 text-slate-400">
          <Cpu className="w-7 h-7 text-[#FF9933]/60" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">No Ticket Focused</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Select a customer ticket from the inbound stream to inspect AI triage, autonomous tool
          execution, and dispatch responses.
        </p>
      </div>
    );
  }

  const isResolved = ticket.status === "Resolved" || ticket.status === "AI Resolved";
  const isEscalated = ticket.status === "Escalated";
  const inboundMessage = ticket.sanitized_message || ticket.original_message || "No message content available.";

  return (
    <div className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden border border-white/10 dark:border-white/[0.08] shadow-2xl h-full">
      {/* Workspace Header */}
      <div className="p-5 sm:p-6 border-b border-white/10 bg-white/[0.02] flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <h1 className="text-lg font-bold text-white tracking-tight">
              {ticket.customer_name || "Telegram User"}
            </h1>
            {ticket.customer_handle && (
              <span className="text-xs text-slate-400 font-mono">
                {ticket.customer_handle.startsWith("@") ? ticket.customer_handle : `@${ticket.customer_handle}`}
              </span>
            )}
            {/* Category Slug Badge */}
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10">
              <Tag className="w-3 h-3 text-slate-400" />
              {ticket.category_slug || "Uncategorized"}
            </span>
            <StatusPill status={ticket.status} pulse={!isResolved} />
          </div>
          <p className="text-xs text-slate-400 font-mono">
            ID: <span className="text-slate-300">{ticket.id}</span> • Channel:{" "}
            <strong className="text-white font-sans">{ticket.channel}</strong>
            {ticket.resolved_at && (
              <span className="text-emerald-400 ml-2 font-sans">
                • Resolved: {new Date(ticket.resolved_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {onPreviewDispatch && (
            <button
              onClick={onPreviewDispatch}
              className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 font-medium px-3.5 py-2 rounded-xl transition-all shadow-xs"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>Preview</span>
            </button>
          )}

          <button
            onClick={onEscalate}
            disabled={isEscalated}
            className="flex items-center gap-1.5 text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold px-3.5 py-2 rounded-xl transition-all disabled:opacity-40"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>{isEscalated ? "Escalated to Tier-2" : "Escalate to Human"}</span>
          </button>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar">
        {/* Customer Inbound Chat Bubble */}
        <div className="space-y-1.5 max-w-2xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <span>Customer Transmission</span>
            <span className="text-slate-500 font-normal">
              via {ticket.channel} • {new Date(ticket.created_at).toLocaleTimeString()}
            </span>
          </div>

          <div className="relative bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm p-4 text-sm text-slate-200 leading-relaxed shadow-lg">
            {inboundMessage}
          </div>
        </div>

        {/* Autonomous Tool Action Banner (if executed) */}
        {ticket.tool_action?.actionTaken && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-xs flex items-start gap-3 shadow-lg max-w-2xl"
          >
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 flex-shrink-0 mt-0.5">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-emerald-300">Autonomous Tool Executed:</span>
                <span className="font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 text-[10px]">
                  {ticket.tool_action.toolName}
                </span>
              </div>
              <p className="text-emerald-300/80 leading-relaxed">{ticket.tool_action.message}</p>
            </div>
          </motion.div>
        )}

        {/* ZKP Audit Proof context (if present) */}
        {ticket.kb_context && (
          <div className="bg-[#1E3A8A]/20 border border-[#3B82F6]/30 rounded-2xl p-3.5 text-xs flex items-start gap-3 text-slate-300 max-w-2xl">
            <BookOpen className="w-4 h-4 text-[#60A5FA] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#60A5FA]">Audit Reference: </span>
              <span className="font-mono text-slate-400 text-[11px]">{ticket.kb_context}</span>
            </div>
          </div>
        )}

        {/* Tricolor Typing Indicator (Pulsing dots) */}
        {!isResolved && (
          <div className="flex items-center gap-2 py-1 px-1">
            <span className="text-[11px] text-slate-400 font-mono">Agent Engine Active</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#FF9933] animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-white animate-pulse delay-150" />
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse delay-300" />
            </div>
          </div>
        )}
      </div>

      {/* Reply Drafting Box */}
      <div className="p-5 sm:p-6 border-t border-white/10 bg-white/[0.02] space-y-3.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("reply")}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg bg-[#FF9933]/15 text-[#FFB066] border border-[#FF9933]/30 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF9933]" />
              <span>AI Suggested Response</span>
            </button>
            <span className="text-[11px] font-semibold bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30 px-2.5 py-0.5 rounded-md font-mono">
              {ticket.confidence_score}% Confidence
            </span>
          </div>

          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-[#3B82F6]" />
            Target: <strong className="text-slate-200">{ticket.channel} Gateway</strong>
          </span>
        </div>

        <textarea
          rows={3}
          value={replyText}
          onChange={(e) => onReplyTextChange(e.target.value)}
          placeholder="Customize response before outbound dispatch..."
          className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-xs sm:text-sm text-white focus:outline-none focus:border-[#FF9933]/60 focus:ring-1 focus:ring-[#FF9933]/40 resize-none transition custom-scrollbar font-sans"
        />

        <div className="flex items-center justify-between gap-4">
          <div className="text-[11px] text-slate-400">
            {isResolved ? (
              <span className="text-[#10B981] flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Already Resolved & Dispatched
              </span>
            ) : (
              <span>Edit reply or click dispatch to trigger outbound transmission</span>
            )}
          </div>

          <GradientButton
            variant="saffron"
            size="md"
            icon={<Send className="w-4 h-4" />}
            isLoading={isSending}
            onClick={onSendReply}
            disabled={!replyText.trim() || isSending}
          >
            Dispatch Reply
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
