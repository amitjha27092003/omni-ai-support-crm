"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Sun,
  Moon,
  Bell,
  Inbox,
  BarChart2,
  Users,
  Settings,
  Shield,
  Layers,
  Search,
} from "lucide-react";

interface NavbarProps {
  activeTab?: string;
  onTabSelect?: (tab: string) => void;
  pendingCount?: number;
}

export function Navbar({
  activeTab = "tickets",
  onTabSelect,
  pendingCount = 0,
}: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { id: "tickets", label: "Support Tickets", icon: Layers },
    { id: "inbox", label: "AI Inbox", icon: Inbox, badge: pendingCount > 0 ? pendingCount : undefined },
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
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => onTabSelect?.("tickets")}>
            <div className="w-10 h-10 rounded-2xl p-0.5 bg-gradient-to-tr from-[#FF9933] via-[#3B82F6] to-[#10B981] shadow-lg shadow-[#FF9933]/20 group-hover:shadow-[#FF9933]/40 transition-all duration-300">
              <div className="w-full h-full bg-[#0A0A0F] rounded-[14px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-[#FF9933]" />
              </div>
            </div>
            {/* Ambient Aura */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#FF9933] via-[#1E3A8A] to-[#10B981] opacity-30 blur-md -z-10 group-hover:opacity-60 transition duration-300" />
          </div>

          <div className="cursor-pointer select-none" onClick={() => onTabSelect?.("tickets")}>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-tricolor-gradient">
                OmniAI
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-md bg-[#1E3A8A]/40 text-[#60A5FA] border border-[#3B82F6]/30">
                Ops
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">
              Ashoka Intelligence Suite
            </p>
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

          {/* Notification Bell */}
          <button
            aria-label="Notifications"
            className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF9933] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF9933]" />
            </span>
          </button>

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
    </header>
  );
}
