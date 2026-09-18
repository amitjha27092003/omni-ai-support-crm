"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Search,
  RefreshCw,
  MessageSquare,
  Smartphone,
  Mail,
  Send,
  AlertCircle,
  Tag,
  CheckCircle2,
} from "lucide-react";
import { StatusPill } from "@/components/ui/StatusPill";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { EmptyTickets } from "./EmptyTickets";
import { type Ticket } from "@/hooks/useTickets";

export type { Ticket };

interface TicketsTableProps {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  onSelectTicket: (ticket: Ticket) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterChannel: "All" | "Telegram" | "WhatsApp" | "Email" | "Lark";
  onFilterChannelChange: (ch: "All" | "Telegram" | "WhatsApp" | "Email" | "Lark") => void;
  filterStatus: "All" | "Pending" | "Open" | "AI In-Progress" | "AI Resolved" | "Escalated" | "Resolved";
  onFilterStatusChange: (status: any) => void;
  isFetching: boolean;
  error?: string | null;
  onRefresh: () => void;
}

export function TicketsTable({
  tickets,
  selectedTicket,
  onSelectTicket,
  searchQuery,
  onSearchChange,
  filterChannel,
  onFilterChannelChange,
  filterStatus,
  onFilterStatusChange,
  isFetching,
  error,
  onRefresh,
}: TicketsTableProps) {
  const channelIcons: Record<string, any> = {
    Telegram: Send,
    WhatsApp: Smartphone,
    Email: Mail,
    Lark: MessageSquare,
  };

  const channelColors: Record<string, string> = {
    Telegram: "text-[#38BDF8] bg-sky-500/10 border-sky-500/30",
    WhatsApp: "text-[#34D399] bg-emerald-500/10 border-emerald-500/30",
    Email: "text-[#FFAA55] bg-amber-500/10 border-amber-500/30",
    Lark: "text-[#818CF8] bg-indigo-500/10 border-indigo-500/30",
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl overflow-hidden border border-white/10 dark:border-white/[0.08]">
      {/* Header controls */}
      <div className="p-4 sm:p-5 border-b border-white/10 space-y-3.5 bg-white/[0.02]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="font-bold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
              <span>Inbound Stream</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
              </span>
            </h2>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/15">
              {tickets.length}
            </span>
          </div>

          <button
            onClick={onRefresh}
            aria-label="Refresh Tickets"
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all duration-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-[#FF9933]" : ""}`} />
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search customer, keywords, handle, message..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-black/20 dark:bg-black/30 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#FF9933]/50 focus:ring-1 focus:ring-[#FF9933]/30 transition"
          />
        </div>

        {/* Channel filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs custom-scrollbar">
          {(["All", "Telegram", "WhatsApp", "Email", "Lark"] as const).map((ch) => (
            <button
              key={ch}
              onClick={() => onFilterChannelChange(ch)}
              className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                filterChannel === ch
                  ? "bg-[#1E3A8A] text-white border border-[#3B82F6]/60 shadow-xs shadow-blue-500/20"
                  : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-transparent"
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="m-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span className="truncate">{error}</span>
          </div>
          <button
            onClick={onRefresh}
            className="px-2 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[10px] font-semibold transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Ticket List Stream */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
        {isFetching && tickets.length === 0 ? (
          <LoadingSkeleton />
        ) : tickets.length === 0 ? (
          <EmptyTickets />
        ) : (
          tickets.map((t) => {
            const isSelected = selectedTicket?.id === t.id;
            const ChannelIcon = channelIcons[t.channel] || MessageSquare;
            const channelStyle =
              channelColors[t.channel] || "text-slate-300 bg-white/5 border-white/10";

            // Primary display text from sanitized_message, fallback to original_message
            const displayText = t.sanitized_message || t.original_message || "Empty message body";

            return (
              <motion.div
                key={t.id}
                onClick={() => onSelectTicket(t)}
                whileHover={{ x: 3 }}
                transition={{ duration: 0.15 }}
                className={`p-4 cursor-pointer transition-all duration-200 relative ${
                  isSelected
                    ? "bg-white/10 dark:bg-white/[0.08] border-l-4 border-l-[#FF9933] shadow-md"
                    : "hover:bg-white/5 hover:border-l-2 hover:border-l-[#3B82F6]/50"
                }`}
              >
                {/* Top Row: Customer Name + Handle + Timestamp */}
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                    <span className="font-semibold text-xs text-white truncate">
                      {t.customer_name || "Telegram User"}
                    </span>
                    {t.customer_handle && (
                      <span className="text-[10px] text-slate-400 truncate">
                        {t.customer_handle.startsWith("@") ? t.customer_handle : `@${t.customer_handle}`}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                    {new Date(t.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Message Body (sanitized_message, fallback original_message) */}
                <p className="text-xs text-slate-300 dark:text-slate-300 line-clamp-2 mb-2 leading-relaxed font-normal">
                  {displayText}
                </p>

                {/* AI Reply snippet preview if available */}
                {t.ai_reply && (
                  <div className="mb-2 text-[11px] text-blue-300/80 bg-blue-500/10 border border-blue-500/20 rounded-lg px-2 py-1 line-clamp-1">
                    <span className="text-[#FF9933] font-semibold">AI:</span> {t.ai_reply}
                  </div>
                )}

                {/* Bottom Row: Channel badge + Category slug + Status pill */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md border ${channelStyle}`}
                    >
                      <ChannelIcon className="w-2.5 h-2.5" />
                      {t.channel}
                    </span>

                    {/* Category Slug Badge */}
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                      <Tag className="w-2.5 h-2.5 text-slate-500" />
                      {t.category_slug || "Uncategorized"}
                    </span>

                    {/* Confidence Score Pill */}
                    {t.confidence_score > 0 && (
                      <span className="text-[9px] font-mono text-emerald-400 px-1 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">
                        {t.confidence_score}%
                      </span>
                    )}
                  </div>

                  <StatusPill status={t.status} pulse={t.status !== "Resolved" && t.status !== "AI Resolved"} />
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
