"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Sun,
  Moon,
  Bell,
  BarChart2,
  Users,
  Settings,
  Shield,
  Layers,
  Search,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle2,
  Menu,
  MessageSquare,
} from "lucide-react";
import { MobileMenu } from "./MobileMenu";
import { type Ticket } from "@/hooks/useTickets";

interface NavbarProps {
  activeTab?: string;
  onTabSelect?: (tab: string) => void;
  pendingCount?: number;
  activeOpenCount?: number;
  isTelemetryLoading?: boolean;
  escalatedTickets?: Ticket[];
  onSelectTicket?: (ticket: Ticket) => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onAutoPilot?: () => void;
  isAutoPiloting?: boolean;
  onExportCSV?: () => void;
  onToggleTerminal?: () => void;
}

export function Navbar({
  activeTab = "tickets",
  onTabSelect,
  pendingCount = 0,
  activeOpenCount,
  isTelemetryLoading = false,
  escalatedTickets = [],
  onSelectTicket,
  soundEnabled = true,
  onToggleSound,
  onAutoPilot,
  isAutoPiloting = false,
  onExportCSV,
  onToggleTerminal,
}: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showEscalatedDropdown, setShowEscalatedDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const escalatedCount = escalatedTickets.length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowEscalatedDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { id: "tickets", label: "Support Tickets", icon: Layers, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: "analytics", label: "Analytics", icon: BarChart2 },
    { id: "customers", label: "Customers", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled
          ? "py-2.5 bg-[#0A0A0F]/80 dark:bg-[#0A0A0F]/85 backdrop-blur-2xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
          : "py-4 bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Brand Logo & Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hamburger Menu on Mobile & Tablet (<lg) */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open mobile navigation"
            className="lg:hidden w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition active:scale-95 min-h-[44px] min-w-[44px]"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative group cursor-pointer" onClick={() => onTabSelect?.("tickets")}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl p-0.5 bg-gradient-to-tr from-[#FF9933] via-[#3B82F6] to-[#10B981] shadow-lg shadow-[#FF9933]/20 group-hover:shadow-[#FF9933]/40 transition-all duration-300">
              <div className="w-full h-full bg-[#0A0A0F] rounded-[14px] flex items-center justify-center">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF9933]" />
              </div>
            </div>
            {/* Ambient Aura */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#FF9933] via-[#1E3A8A] to-[#10B981] opacity-30 blur-md -z-10 group-hover:opacity-60 transition duration-300" />
          </div>

          <div className="cursor-pointer select-none" onClick={() => onTabSelect?.("tickets")}>
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-xl font-black tracking-tight text-tricolor-gradient">
                OmniAI
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-md bg-[#1E3A8A]/40 text-[#60A5FA] border border-[#3B82F6]/30">
                Ops
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide hidden sm:block">
              Ashoka Intelligence Suite
            </p>
          </div>

          {/* Live Telemetry Pulse Pill */}
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/10 text-[10px] font-mono text-slate-300 ml-2 shadow-inner">
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#10B981]" />
            </span>
            <span className="text-slate-400">Telemetry:</span>
            <span className="font-semibold text-white">
              {activeOpenCount !== undefined ? `${activeOpenCount} Active Open` : "Live 30s"}
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-white/5 dark:bg-white/[0.04] p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabSelect?.(item.id)}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 outline-none ${
                  isActive
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute inset-0 bg-gradient-to-r from-[#FF9933]/20 via-[#3B82F6]/20 to-[#10B981]/20 border border-white/15 rounded-xl -z-10 shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#FF9933]" : "text-slate-400"}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#FF9933] text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Section: Theme Toggle, Notifications, User Avatar */}
        <div className="flex items-center gap-3">
          {/* Public Customer Support Portal Link */}
          <Link
            href="/support"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Public Customer Support Portal"
            title="Open Multilingual Customer Chat Portal (/support)"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF9933]/15 via-[#1E3A8A]/20 to-[#10B981]/15 hover:from-[#FF9933]/25 hover:to-[#10B981]/25 border border-white/15 text-xs text-slate-200 hover:text-white transition shadow-sm font-medium"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#FF9933]" />
            <span>Support Chat</span>
          </Link>

          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle Theme"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all shadow-sm"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={theme}
                  initial={{ y: -10, opacity: 0, rotate: -45 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  exit={{ y: 10, opacity: 0, rotate: 45 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4 text-[#FF9933]" />
                  ) : (
                    <Moon className="w-4 h-4 text-[#3B82F6]" />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>
          )}

          {/* Audio Chime Alert Toggle */}
          {onToggleSound && (
            <button
              onClick={onToggleSound}
              aria-label={soundEnabled ? "Mute escalation alerts" : "Enable escalation alerts"}
              title={
                soundEnabled
                  ? "Escalation chime enabled (Click to mute)"
                  : "Escalation chime muted (Click to enable)"
              }
              className={`p-2 rounded-xl border transition-all ${
                soundEnabled
                  ? "bg-[#FF9933]/15 border-[#FF9933]/40 text-[#FFB066] shadow-xs shadow-[#FF9933]/20"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          )}

          {/* Notification Bell with Escalation Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowEscalatedDropdown(!showEscalatedDropdown)}
              aria-label="Escalated Tickets Alert"
              title={
                escalatedCount > 0
                  ? `${escalatedCount} ticket(s) escalated to Human Agent`
                  : "No escalated tickets"
              }
              className={`relative p-2 rounded-xl border transition-all ${
                escalatedCount > 0
                  ? "bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-md shadow-rose-500/20"
                  : "bg-white/5 border-white/10 text-slate-300 hover:text-white"
              }`}
            >
              <Bell className="w-4 h-4" />
              {escalatedCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-[#FF9933] via-[#FF8008] to-[#EA580C] text-[10px] font-bold text-white shadow-md shadow-[#FF9933]/40 border border-white/20">
                  <span className="animate-ping absolute inset-0 rounded-full bg-[#FF9933] opacity-75" />
                  <span className="relative z-10">{escalatedCount}</span>
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showEscalatedDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl glass-panel border border-white/15 dark:border-white/10 shadow-2xl p-3.5 z-50 overflow-hidden backdrop-blur-2xl bg-[#0F101A]/95 text-slate-200"
                >
                  <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-white tracking-tight">
                        Escalated to Human Agent
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                      {escalatedCount} Active
                    </span>
                  </div>

                  {escalatedTickets.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      ✨ No active escalations. All queries managed by OmniAI!
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                      {escalatedTickets.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            onSelectTicket?.(t);
                            setShowEscalatedDropdown(false);
                          }}
                          className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/30 cursor-pointer transition flex flex-col gap-1 text-left group"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-xs text-white truncate max-w-[180px] group-hover:text-rose-200 transition">
                              {t.customer_name || t.customer}
                            </span>
                            <span className="text-[10px] font-mono text-rose-400 font-medium">
                              {new Date(t.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                            {t.sanitized_message || t.original_message || "Human agent requested"}
                          </p>
                          <div className="flex items-center justify-between text-[10px] pt-1 text-slate-400 border-t border-white/5 mt-0.5">
                            <span>
                              Via <strong className="text-slate-200">{t.channel}</strong>
                            </span>
                            <span className="text-[#FF9933] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition">
                              Focus Ticket →
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Avatar with Tricolor Ring Gradient */}
          <div className="flex items-center gap-2.5 pl-1.5">
            <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-[#FF9933] via-white to-[#10B981] shadow-md shadow-black/20">
              <div className="w-8 h-8 rounded-full bg-[#12131F] flex items-center justify-center font-bold text-xs text-white border border-black/40">
                AI
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          onTabSelect?.(tab);
          setMobileMenuOpen(false);
        }}
        pendingCount={pendingCount}
        escalatedCount={escalatedCount}
        activeOpenCount={activeOpenCount}
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound}
        theme={theme}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        onAutoPilot={onAutoPilot}
        isAutoPiloting={isAutoPiloting}
        onExportCSV={onExportCSV}
        onToggleTerminal={onToggleTerminal}
      />
    </header>
  );
}
