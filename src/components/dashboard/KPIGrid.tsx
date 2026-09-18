"use client";

import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import {
  Inbox,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from "lucide-react";

interface KPIGridProps {
  totalTickets: number;
  pendingTickets: number;
  resolvedTickets: number;
  escalatedTickets: number;
  resolutionRate: number;
}

export function KPIGrid({
  totalTickets,
  pendingTickets,
  resolvedTickets,
  escalatedTickets,
  resolutionRate,
}: KPIGridProps) {
  // Sparkline SVG helper
  const renderSparkline = (points: number[], strokeColor: string) => {
    const min = Math.min(...points);
    const max = Math.max(...points) || 1;
    const width = 80;
    const height = 24;

    const pathD = points
      .map((p, i) => {
        const x = (i / (points.length - 1)) * width;
        const y = height - ((p - min) / (max - min || 1)) * (height - 6) - 3;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");

    return (
      <svg width={width} height={height} className="overflow-visible">
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const cards = [
    {
      title: "Active Open Tickets",
      value: pendingTickets,
      prefix: "",
      suffix: "",
      delta: pendingTickets > 0 ? "+3" : "0",
      isPositive: false,
      icon: Inbox,
      ringColor: "from-[#FF9933] to-[#EA580C]",
      iconColor: "text-[#FF9933]",
      glowColor: "saffron" as const,
      sparkline: [4, 7, 5, 8, 6, 9, pendingTickets || 5],
      sparklineColor: "#FF9933",
      label: "Live inbound requiring review",
    },
    {
      title: "AI Autonomous Resolved",
      value: resolvedTickets,
      prefix: "",
      suffix: "",
      delta: `+${resolutionRate}%`,
      isPositive: true,
      icon: CheckCircle2,
      ringColor: "from-[#10B981] to-[#059669]",
      iconColor: "text-[#10B981]",
      glowColor: "green" as const,
      sparkline: [2, 5, 8, 12, 15, 18, resolvedTickets || 20],
      sparklineColor: "#10B981",
      label: "Zero-human touch resolutions",
    },
    {
      title: "Avg Response Latency",
      value: 1.4,
      format: () => "1.4s",
      delta: "-42%",
      isPositive: true,
      icon: Clock,
      ringColor: "from-[#1E3A8A] to-[#3B82F6]",
      iconColor: "text-[#60A5FA]",
      glowColor: "chakra" as const,
      sparkline: [4.2, 3.5, 2.8, 2.1, 1.8, 1.5, 1.4],
      sparklineColor: "#3B82F6",
      label: "Outbound Telegram/WhatsApp dispatch",
    },
    {
      title: "CSAT & Audit Quality",
      value: 98,
      suffix: "%",
      delta: "+4.8%",
      isPositive: true,
      icon: Sparkles,
      ringColor: "from-[#FF9933] via-[#3B82F6] to-[#10B981]",
      iconColor: "text-white",
      glowColor: "tricolor" as const,
      sparkline: [88, 91, 93, 95, 96, 97, 98],
      sparklineColor: "#10B981",
      label: "Realtime customer sentiment score",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <GlassCard
            key={idx}
            glowColor={card.glowColor}
            className="p-5 sm:p-6 relative group overflow-hidden"
          >
            {/* Top Row: Icon + Sparkline */}
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${card.ringColor} p-0.5 shadow-md`}
              >
                <div className="w-full h-full bg-[#12131F] rounded-[14px] flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
              </div>
              <div className="opacity-70 group-hover:opacity-100 transition-opacity">
                {renderSparkline(card.sparkline, card.sparklineColor)}
              </div>
            </div>

            {/* Middle: Title & Big Number */}
            <div className="space-y-1 mb-3">
              <div className="text-xs font-semibold text-slate-400 group-hover:text-slate-300 transition-colors">
                {card.title}
              </div>
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-baseline gap-1">
                <AnimatedNumber
                  value={card.value}
                  suffix={card.suffix}
                  prefix={card.prefix}
                  format={card.format}
                />
              </div>
            </div>

            {/* Bottom Row: Delta & Subtext */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
              <div className="flex items-center gap-1 font-semibold">
                {card.isPositive ? (
                  <span className="text-[#10B981] flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {card.delta}
                  </span>
                ) : (
                  <span className="text-[#FF9933] flex items-center gap-0.5">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {card.delta}
                  </span>
                )}
                <span className="text-slate-400 text-[11px] font-normal">vs prev shift</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Realtime</span>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
