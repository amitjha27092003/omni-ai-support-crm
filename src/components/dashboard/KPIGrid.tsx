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
} from "lucide-react";
import type { TelemetryData } from "@/hooks/useTelemetry";

interface KPIGridProps {
  telemetry?: TelemetryData;
  totalTickets?: number;
  pendingTickets?: number;
  resolvedTickets?: number;
  escalatedTickets?: number;
  resolutionRate?: number;
}

export function KPIGrid({
  telemetry,
  totalTickets,
  pendingTickets,
  resolvedTickets,
  escalatedTickets,
  resolutionRate,
}: KPIGridProps) {
  // Sparkline SVG helper
  const renderSparkline = (points: number[], strokeColor: string) => {
    const validPoints = points.map((p) => (isNaN(p) || p == null ? 0 : p));
    const min = Math.min(...validPoints);
    const max = Math.max(...validPoints) || 1;
    const width = 80;
    const height = 24;

    const pathD = validPoints
      .map((p, i) => {
        const x = (i / (validPoints.length - 1 || 1)) * width;
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

  // Gracefully fallback to ticket counts while telemetry computes
  const activeVal =
    telemetry?.activeOpen.value !== null && telemetry?.activeOpen.value !== undefined
      ? telemetry.activeOpen.value
      : pendingTickets !== undefined
      ? pendingTickets
      : null;

  const resolvedVal =
    telemetry?.aiResolved.value !== null && telemetry?.aiResolved.value !== undefined
      ? telemetry.aiResolved.value
      : resolvedTickets !== undefined
      ? resolvedTickets
      : null;

  const latencyVal = telemetry?.avgLatency.value ?? null;
  const csatVal = telemetry?.csat.value ?? null;

  const cards = [
    {
      title: "Active Open Tickets",
      value: activeVal,
      prefix: "",
      suffix: "",
      formattedDelta: telemetry?.activeOpen.formattedDelta || "—",
      isPositive: telemetry?.activeOpen.isPositive ?? true,
      icon: Inbox,
      ringColor: "from-[#FF9933] to-[#EA580C]",
      iconColor: "text-[#FF9933]",
      glowColor: "saffron" as const,
      sparkline: [
        Math.max(1, (activeVal ?? 3) - 2),
        Math.max(1, (activeVal ?? 3) + 1),
        Math.max(1, (activeVal ?? 3) - 1),
        activeVal ?? 3,
      ],
      sparklineColor: "#FF9933",
      label: "Live inbound requiring review",
    },
    {
      title: "AI Autonomous Resolved",
      value: resolvedVal,
      prefix: "",
      suffix: "",
      formattedDelta: telemetry?.aiResolved.formattedDelta || "—",
      isPositive: telemetry?.aiResolved.isPositive ?? true,
      icon: CheckCircle2,
      ringColor: "from-[#10B981] to-[#059669]",
      iconColor: "text-[#10B981]",
      glowColor: "green" as const,
      sparkline: [
        Math.max(0, (resolvedVal ?? 5) - 4),
        Math.max(0, (resolvedVal ?? 5) - 2),
        Math.max(1, (resolvedVal ?? 5) - 1),
        resolvedVal ?? 5,
      ],
      sparklineColor: "#10B981",
      label: "Zero-human touch resolutions",
    },
    {
      title: "Avg Response Latency",
      value: latencyVal,
      format: (n: number) => (n < 60 ? `${n.toFixed(1)}s` : `${(n / 60).toFixed(1)}m`),
      formattedDelta: telemetry?.avgLatency.formattedDelta || "—",
      isPositive: telemetry?.avgLatency.isPositive ?? true,
      icon: Clock,
      ringColor: "from-[#1E3A8A] to-[#3B82F6]",
      iconColor: "text-[#60A5FA]",
      glowColor: "chakra" as const,
      sparkline:
        latencyVal !== null
          ? [latencyVal * 1.4, latencyVal * 1.2, latencyVal * 1.1, latencyVal]
          : [2, 1.8, 1.5, 1.4],
      sparklineColor: "#3B82F6",
      label: "Outbound Telegram/WhatsApp dispatch",
    },
    {
      title: "CSAT & Audit Quality",
      value: csatVal,
      suffix: csatVal !== null ? "%" : "",
      format: (n: number) => n.toFixed(1),
      formattedDelta: telemetry?.csat.formattedDelta || "—",
      isPositive: telemetry?.csat.isPositive ?? true,
      icon: Sparkles,
      ringColor: "from-[#FF9933] via-[#3B82F6] to-[#10B981]",
      iconColor: "text-white",
      glowColor: "tricolor" as const,
      sparkline:
        csatVal !== null
          ? [Math.max(60, csatVal - 4), Math.max(60, csatVal - 2), csatVal]
          : [88, 92, 95],
      sparklineColor: "#10B981",
      label: "Realtime customer sentiment score",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <GlassCard
            key={idx}
            glowColor={card.glowColor}
            className="p-3.5 sm:p-5 lg:p-6 relative group overflow-hidden flex flex-col justify-between"
          >
            {/* Top Row: Icon + Sparkline */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr ${card.ringColor} p-0.5 shadow-md`}
              >
                <div className="w-full h-full bg-[#12131F] rounded-[10px] sm:rounded-[14px] flex items-center justify-center">
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.iconColor}`} />
                </div>
              </div>
              <div className="hidden xs:block opacity-70 group-hover:opacity-100 transition-opacity">
                {renderSparkline(card.sparkline, card.sparklineColor)}
              </div>
            </div>

            {/* Middle: Title & Big Number */}
            <div className="space-y-0.5 sm:space-y-1 mb-2 sm:mb-3">
              <div className="text-[11px] sm:text-xs font-semibold text-slate-400 group-hover:text-slate-300 transition-colors truncate">
                {card.title}
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-baseline gap-1">
                {card.value !== null && card.value !== undefined ? (
                  <AnimatedNumber
                    value={card.value}
                    suffix={card.suffix}
                    prefix={card.prefix}
                    format={card.format}
                  />
                ) : (
                  <span className="text-slate-500 font-medium text-2xl sm:text-3xl">—</span>
                )}
              </div>
            </div>

            {/* Bottom Row: Delta & Subtext */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
              <div className="flex items-center gap-1 font-semibold">
                {card.formattedDelta !== "—" ? (
                  <span
                    className={`flex items-center gap-0.5 ${
                      card.isPositive ? "text-[#10B981]" : "text-[#EF4444]"
                    }`}
                  >
                    {card.isPositive ? (
                      <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-[#EF4444]" />
                    )}
                    <span>{card.formattedDelta}</span>
                  </span>
                ) : (
                  <span className="text-slate-500 font-mono">—</span>
                )}
                <span className="text-slate-400 text-[11px] font-normal">vs prev 24h</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                Live 30s
              </span>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
