"use client";

import React from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Sparkles, BarChart3, Bot, ShieldCheck, Zap } from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";

// Dynamically import 3D canvas with SSR disabled
const Hero3D = dynamic(() => import("./Hero3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] flex items-center justify-center">
      <div className="w-32 h-32 rounded-full border-2 border-dashed border-[#FF9933]/30 animate-spin" />
    </div>
  ),
});

interface HeroContentProps {
  onOpenInbox?: () => void;
  onOpenAnalytics?: () => void;
  onOpenAutoPilot?: () => void;
  pendingCount?: number;
}

export function HeroContent({
  onOpenInbox,
  onOpenAnalytics,
  onOpenAutoPilot,
  pendingCount = 0,
}: HeroContentProps) {
  const headlineWords = "Intelligent Support. Infinite Scale.".split(" ");

  return (
    <div className="relative w-full rounded-3xl overflow-hidden glass-panel border border-white/10 dark:border-white/[0.08] shadow-2xl p-6 sm:p-10 mb-8 tricolor-hairline-top">
      {/* Background glow blobs */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#FF9933]/15 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-[#1E3A8A]/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#10B981]/15 rounded-full blur-[90px] pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Headline & Content */}
        <div className="lg:col-span-7 space-y-6">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-medium"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
            </span>
            <span className="text-slate-300">OmniAI Ops Engine 2.0</span>
            <span className="text-[#FF9933] font-bold">• Tricolor Speed</span>
          </motion.div>

          {/* Staggered Word Reveal Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12]">
            {headlineWords.map((word, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.12 }}
                className={`inline-block mr-3 ${
                  idx === 0
                    ? "text-saffron-gradient"
                    : idx === 1
                    ? "text-white"
                    : idx === 2
                    ? "text-chakra-gradient"
                    : "text-green-gradient"
                }`}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-slate-300 dark:text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed font-normal"
          >
            Autonomous omnichannel triage powered by Supabase Realtime & Gemini 2.5.
            Saffron energy, Ashoka Chakra mathematical precision, and rapid green resolution.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="flex flex-wrap items-center gap-3.5 pt-2"
          >
            <GradientButton
              variant="saffron"
              size="md"
              icon={<Bot className="w-4 h-4" />}
              onClick={onOpenInbox}
            >
              Open AI Inbox
            </GradientButton>

            <GradientButton
              variant="glass"
              size="md"
              icon={<BarChart3 className="w-4 h-4 text-[#60A5FA]" />}
              onClick={onOpenAnalytics}
            >
              View Analytics
            </GradientButton>

            {pendingCount > 0 && onOpenAutoPilot && (
              <GradientButton
                variant="green"
                size="md"
                icon={<Zap className="w-4 h-4 fill-white" />}
                onClick={onOpenAutoPilot}
              >
                Auto-Pilot ({pendingCount})
              </GradientButton>
            )}
          </motion.div>

          {/* Micro Telemetry Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex items-center gap-6 pt-3 text-xs text-slate-400"
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              <span>ZKP Enterprise Audited</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#FF9933]" />
              <span>Sub-second Latency</span>
            </div>
          </motion.div>
        </div>

        {/* Right 3D Ashoka Chakra Torus */}
        <div className="lg:col-span-5 h-[340px] sm:h-[420px] relative flex items-center justify-center">
          <Hero3D />
        </div>
      </div>
    </div>
  );
}
