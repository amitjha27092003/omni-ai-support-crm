"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Activity,
  Database,
  Zap,
  Download,
  Terminal,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Server,
  SlidersHorizontal,
} from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";

interface SidebarProps {
  currentView: "tickets" | "analytics" | "kb" | "customers";
  onViewChange: (view: "tickets" | "analytics" | "kb" | "customers") => void;
  pendingCount: number;
  totalCount: number;
  resolvedCount: number;
  escalatedCount: number;
  isAutoPiloting: boolean;
  onAutoPilot: () => void;
  onExportCSV: () => void;
  onToggleTerminal: () => void;
  isTerminalOpen: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  currentView,
  onViewChange,
  pendingCount,
  totalCount,
  resolvedCount,
  escalatedCount,
  isAutoPiloting,
  onAutoPilot,
  onExportCSV,
  onToggleTerminal,
  isTerminalOpen,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const menuItems = [
    {
      id: "tickets" as const,
      label: "Tickets Queue",
      icon: MessageSquare,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      id: "analytics" as const,
      label: "Operations Pulse",
      icon: Activity,
    },
    {
      id: "kb" as const,
      label: "Grounding KB",
      icon: Database,
    },
  ];

  return (
    <aside
      className={`hidden lg:flex relative flex-col justify-between glass-panel transition-all duration-300 z-30 border-r border-white/10 dark:border-white/[0.08] flex-shrink-0 ${
        isCollapsed ? "w-20 p-3" : "w-64 p-5"
      }`}
    >
      {/* Collapse Toggle Button */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-[#161726] border border-white/15 text-slate-300 hover:text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 z-40"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      )}

      {/* Top Nav Items */}
      <div className="space-y-6">
        {/* Header / Subhead */}
        {!isCollapsed && (
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Autonomous Core
            </span>
            <span className="text-[10px] font-mono text-[#FF9933] bg-[#FF9933]/10 px-2 py-0.5 rounded border border-[#FF9933]/20">
              v2.5 AI
            </span>
          </div>
        )}

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all relative group outline-none ${
                  isActive
                    ? "bg-white/10 text-white shadow-inner"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                } ${isCollapsed ? "justify-center px-2" : ""}`}
              >
                {/* Active Indicator: Saffron to Green gradient border & glow */}
                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-[#FF9933] via-[#3B82F6] to-[#10B981] shadow-[0_0_12px_rgba(255,153,51,0.8)]" />
                )}

                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? "text-[#FF9933]" : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />

                {!isCollapsed && <span className="truncate">{item.label}</span>}

                {!isCollapsed && item.badge !== undefined && (
                  <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF9933] text-white shadow-xs">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Middle: Actions */}
      <div className="space-y-4 my-4 pt-4 border-t border-white/10">
        <div className="space-y-2">
          <GradientButton
            variant="saffron"
            size="sm"
            className="w-full"
            icon={<Zap className="w-3.5 h-3.5 fill-white" />}
            isLoading={isAutoPiloting}
            disabled={isAutoPiloting || pendingCount === 0}
            onClick={onAutoPilot}
          >
            {!isCollapsed ? `Auto-Pilot (${pendingCount})` : `${pendingCount}`}
          </GradientButton>

          <GradientButton
            variant="glass"
            size="sm"
            className="w-full"
            icon={<Download className="w-3.5 h-3.5 text-slate-300" />}
            onClick={onExportCSV}
          >
            {!isCollapsed ? "Export CSV" : ""}
          </GradientButton>
        </div>

        {/* Live Mini Overview */}
        {!isCollapsed && (
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Live Queue Status
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-white/5 border border-white/5 rounded-xl p-2 text-center">
                <div className="text-xs font-bold text-slate-200">{totalCount}</div>
                <div className="text-[9px] text-slate-400">Total</div>
              </div>
              <div className="bg-[#FF9933]/10 border border-[#FF9933]/20 rounded-xl p-2 text-center">
                <div className="text-xs font-bold text-[#FF9933]">{pendingCount}</div>
                <div className="text-[9px] text-[#FF9933]/80">Pending</div>
              </div>
              <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl p-2 text-center">
                <div className="text-xs font-bold text-[#10B981]">{resolvedCount}</div>
                <div className="text-[9px] text-[#10B981]/80">Resolved</div>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-2 text-center">
                <div className="text-xs font-bold text-rose-400">{escalatedCount}</div>
                <div className="text-[9px] text-rose-400/80">Escalated</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom: Telemetry drawer toggle & Online indicator */}
      <div className="pt-3 border-t border-white/10 space-y-3">
        <button
          onClick={onToggleTerminal}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-mono transition-colors ${
            isTerminalOpen
              ? "bg-[#1E3A8A]/30 border border-[#3B82F6]/40 text-[#60A5FA]"
              : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/5"
          } ${isCollapsed ? "justify-center" : ""}`}
        >
          <Terminal className="w-3.5 h-3.5 text-[#10B981]" />
          {!isCollapsed && <span>Live Agent Logs</span>}
        </button>

        {/* System Online Status */}
        <div
          className={`flex items-center gap-2 px-1 text-[11px] font-medium text-slate-400 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
          </span>
          {!isCollapsed && (
            <span className="text-slate-300">
              System: <strong className="text-[#10B981]">Online</strong>
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
