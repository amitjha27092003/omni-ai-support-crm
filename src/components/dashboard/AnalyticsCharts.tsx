"use client";

import React from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";
import { Activity, Zap, TrendingUp, Radio } from "lucide-react";

interface AnalyticsChartsProps {
  totalTickets: number;
  resolvedTickets: number;
  pendingTickets: number;
  escalatedTickets: number;
}

export function AnalyticsCharts({
  totalTickets,
  resolvedTickets,
  pendingTickets,
  escalatedTickets,
}: AnalyticsChartsProps) {
  // Sample time-series data for operations trend
  const timelineData = [
    { time: "09:00", incoming: 4, aiResolved: 3, manual: 1 },
    { time: "11:00", incoming: 8, aiResolved: 7, manual: 1 },
    { time: "13:00", incoming: 14, aiResolved: 12, manual: 2 },
    { time: "15:00", incoming: 18, aiResolved: 16, manual: 1 },
    { time: "17:00", incoming: 12, aiResolved: 11, manual: 1 },
    { time: "19:00", incoming: 9, aiResolved: 8, manual: 0 },
    { time: "Now", incoming: Math.max(totalTickets, 6), aiResolved: Math.max(resolvedTickets, 5), manual: escalatedTickets },
  ];

  const channelData = [
    { name: "Telegram", count: 18, fill: "#38BDF8" },
    { name: "WhatsApp", count: 14, fill: "#34D399" },
    { name: "Email", count: 8, fill: "#FFAA55" },
    { name: "Lark", count: 4, fill: "#818CF8" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
      {/* Main Resolution Velocity Area Chart */}
      <GlassCard
        glowColor="tricolor"
        className="lg:col-span-8 p-6 relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-[#FF9933]/20 to-[#10B981]/20 border border-white/10 text-white">
              <Activity className="w-5 h-5 text-[#FF9933]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Operations Velocity & Autonomous Triage
              </h3>
              <p className="text-xs text-slate-400">
                Hourly throughput with Gemini 2.5 zero-touch resolution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF9933]" />
              <span className="text-slate-300">Incoming</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              <span className="text-slate-300">AI Resolved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
              <span className="text-slate-300">Tier-2</span>
            </div>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={timelineData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="saffronGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF9933" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#FF9933" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(18, 19, 31, 0.9)",
                  borderColor: "rgba(255, 255, 255, 0.15)",
                  borderRadius: "12px",
                  backdropFilter: "blur(12px)",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="incoming"
                stroke="#FF9933"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#saffronGradient)"
              />
              <Area
                type="monotone"
                dataKey="aiResolved"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#greenGradient)"
              />
              <Area
                type="monotone"
                dataKey="manual"
                stroke="#3B82F6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#blueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Omnichannel Distribution Card */}
      <GlassCard glowColor="chakra" className="lg:col-span-4 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/25 text-[#60A5FA]">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Channel Density</h3>
              <p className="text-xs text-slate-400">Live incoming traffic by gateway</p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(18, 19, 31, 0.95)",
                    borderColor: "rgba(255, 255, 255, 0.15)",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SLA Guarantee Footer */}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-slate-400">Target SLA Adherence</span>
          <span className="font-bold text-[#10B981] font-mono">99.8% Passed</span>
        </div>
      </GlassCard>
    </div>
  );
}
