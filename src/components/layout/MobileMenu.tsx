"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Bot,
  MessageSquare,
  Layers,
  BarChart2,
  Users,
  Settings,
  BookOpen,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  AlertTriangle,
  Radio,
  ChevronRight,
  Zap,
  Download,
  Terminal,
} from "lucide-react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  pendingCount?: number;
  escalatedCount?: number;
  activeOpenCount?: number;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  theme?: string;
  onToggleTheme?: () => void;
  onAutoPilot?: () => void;
  isAutoPiloting?: boolean;
  onExportCSV?: () => void;
  onToggleTerminal?: () => void;
}

export function MobileMenu({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  pendingCount = 0,
  escalatedCount = 0,
  activeOpenCount,
  soundEnabled = true,
  onToggleSound,
  theme = "dark",
  onToggleTheme,
  onAutoPilot,
  isAutoPiloting = false,
  onExportCSV,
  onToggleTerminal,
}: MobileMenuProps) {
  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const navItems = [
    { id: "tickets", label: "Support Tickets", icon: Layers, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: "analytics", label: "Operations Pulse", icon: BarChart2, badge: undefined },
    { id: "customers", label: "Customer Directory", icon: Users, badge: undefined },
    { id: "kb", label: "Grounding Knowledge", icon: BookOpen, badge: undefined },
    { id: "settings", label: "Cluster Settings", icon: Settings, badge: undefined },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm -z-10"
          />

          {/* Drawer Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="w-full max-w-[320px] sm:max-w-sm h-full bg-[#0A0A10]/95 border-l border-white/10 shadow-2xl flex flex-col backdrop-blur-2xl text-slate-100 overflow-y-auto custom-scrollbar"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl p-0.5 bg-gradient-to-tr from-[#FF9933] via-[#3B82F6] to-[#10B981]">
                  <div className="w-full h-full bg-[#0A0A0F] rounded-[10px] flex items-center justify-center">
                    <Bot className="w-4 h-4 text-[#FF9933]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-base tracking-tight text-tricolor-gradient">
                      OmniAI
                    </span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-[#1E3A8A]/50 text-[#60A5FA] border border-[#3B82F6]/30">
                      Ops
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Ashoka Intelligence Suite</p>
                </div>
              </div>

              {/* Close Button — min 44x44px touch area */}
              <button
                onClick={onClose}
                aria-label="Close navigation menu"
                className="w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Telemetry Status Bar */}
            <div className="mx-4 my-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
                </span>
                <span className="text-xs text-slate-300 font-medium">Telemetry Sync</span>
              </div>
              <span className="text-[11px] font-mono text-[#34D399] bg-[#10B981]/15 px-2 py-0.5 rounded border border-[#10B981]/30">
                {activeOpenCount !== undefined ? `${activeOpenCount} Active Open` : "Live 30s"}
              </span>
            </div>

            {/* Escalated Alert Indicator if any */}
            {escalatedCount > 0 && (
              <div
                onClick={() => {
                  onSelectTab("tickets");
                  onClose();
                }}
                className="mx-4 mb-2 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-between cursor-pointer hover:bg-rose-500/20 transition group"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                  <div>
                    <div className="text-xs font-bold text-rose-300">
                      {escalatedCount} Escalated Ticket(s)
                    </div>
                    <div className="text-[10px] text-rose-400/80">Requires Human Intervention</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition" />
              </div>
            )}

            {/* Navigation Links */}
            <nav className="p-3 space-y-1 flex-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all duration-150 min-h-[44px] ${
                      isActive
                        ? "bg-gradient-to-r from-[#FF9933]/20 via-[#FF8008]/15 to-transparent border border-[#FF9933]/40 text-[#FFB066]"
                        : "bg-transparent text-slate-300 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${isActive ? "text-[#FF9933]" : "text-slate-400"}`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF9933] text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Public Support Chat Link */}
              <Link
                href="/support"
                onClick={onClose}
                className="w-full flex items-center justify-between p-3 rounded-xl min-h-[44px] text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-[#FF9933]" />
                  <span>Public Support Chat</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF9933]/15 text-[#FFB066] border border-[#FF9933]/30">
                  Multilingual
                </span>
              </Link>
            </nav>

            {/* Quick Actions (Sidebar feature parity on mobile) */}
            {(onAutoPilot || onExportCSV || onToggleTerminal) && (
              <div className="px-4 py-3 border-t border-white/10 space-y-2">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Quick Actions
                </div>
                <div className="space-y-1.5">
                  {onAutoPilot && (
                    <button
                      onClick={() => {
                        onAutoPilot();
                        onClose();
                      }}
                      disabled={isAutoPiloting || pendingCount === 0}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-[#FF9933] via-[#FF8008] to-[#EA580C] text-white text-xs font-bold min-h-[44px] shadow-sm disabled:opacity-50 transition active:scale-95"
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 fill-white" />
                        <span>Auto-Pilot Queue</span>
                      </div>
                      <span className="text-[10px] font-mono bg-black/25 px-2 py-0.5 rounded-md">
                        {pendingCount}
                      </span>
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    {onExportCSV && (
                      <button
                        onClick={() => {
                          onExportCSV();
                          onClose();
                        }}
                        className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white min-h-[44px] transition"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                        <span>Export CSV</span>
                      </button>
                    )}

                    {onToggleTerminal && (
                      <button
                        onClick={() => {
                          onToggleTerminal();
                          onClose();
                        }}
                        className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white min-h-[44px] transition"
                      >
                        <Terminal className="w-3.5 h-3.5 text-[#10B981]" />
                        <span>Agent Logs</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Preference Toggles */}
            <div className="p-4 border-t border-white/10 space-y-3 bg-white/[0.01]">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Quick Preferences
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Theme Toggle */}
                {onToggleTheme && (
                  <button
                    onClick={onToggleTheme}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 min-h-[44px] transition"
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="w-3.5 h-3.5 text-[#FF9933]" />
                        <span>Light Mode</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-3.5 h-3.5 text-[#3B82F6]" />
                        <span>Dark Mode</span>
                      </>
                    )}
                  </button>
                )}

                {/* Sound Chime Toggle */}
                {onToggleSound && (
                  <button
                    onClick={onToggleSound}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium min-h-[44px] transition ${
                      soundEnabled
                        ? "bg-[#FF9933]/15 border-[#FF9933]/40 text-[#FFB066]"
                        : "bg-white/5 border-white/10 text-slate-400"
                    }`}
                  >
                    {soundEnabled ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Chime On</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>Chime Muted</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-500 font-mono">
                OmniAI 2.0 • Tricolor Speed
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
