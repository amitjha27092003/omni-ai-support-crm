"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface TelemetryMetric<T = number> {
  value: T | null;
  formattedValue: string;
  deltaPercent: number | null;
  formattedDelta: string;
  isPositive: boolean;
}

export interface TelemetryData {
  activeOpen: TelemetryMetric<number>;
  aiResolved: TelemetryMetric<number>;
  avgLatency: TelemetryMetric<number>;
  csat: TelemetryMetric<number>;
  isLoading: boolean;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

interface RawDbRow {
  id: string;
  status: string | null;
  confidence_score: number | null;
  created_at: string | null;
  resolved_at: string | null;
}

const emptyMetric: TelemetryMetric<number> = {
  value: null,
  formattedValue: "—",
  deltaPercent: null,
  formattedDelta: "—",
  isPositive: true,
};

export function useTelemetry(): TelemetryData {
  const [activeOpen, setActiveOpen] = useState<TelemetryMetric<number>>(emptyMetric);
  const [aiResolved, setAiResolved] = useState<TelemetryMetric<number>>(emptyMetric);
  const [avgLatency, setAvgLatency] = useState<TelemetryMetric<number>>(emptyMetric);
  const [csat, setCsat] = useState<TelemetryMetric<number>>(emptyMetric);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const isFetchingRef = useRef(false);

  const fetchTelemetry = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const { data, error } = await supabase
        .from("operational_tickets")
        .select("id, status, confidence_score, created_at, resolved_at");

      if (error) {
        console.error("[useTelemetry] Supabase error:", error.message);
        setIsLoading(false);
        return;
      }

      const rows: RawDbRow[] = (data || []) as RawDbRow[];
      const now = Date.now();
      const t24h = now - 24 * 60 * 60 * 1000;
      const t48h = now - 48 * 60 * 60 * 1000;

      // ──────────────────────────────────────────────
      // 1. Active Open Tickets: COUNT WHERE status NOT IN ('Resolved', 'Closed')
      // ──────────────────────────────────────────────
      const openRows = rows.filter(
        (r) => r.status !== "Resolved" && r.status !== "Closed"
      );
      const activeOpenCount = openRows.length;

      // Deltas: compare tickets created in last 24h vs previous 24h (24h-48h window)
      const open24h = openRows.filter((r) => {
        if (!r.created_at) return false;
        const time = new Date(r.created_at).getTime();
        return time >= t24h;
      }).length;

      const openPrev24h = openRows.filter((r) => {
        if (!r.created_at) return false;
        const time = new Date(r.created_at).getTime();
        return time >= t48h && time < t24h;
      }).length;

      let openDelta: number | null = null;
      let openDeltaStr = "—";
      let openIsPositive = true;

      if (openPrev24h > 0) {
        openDelta = Math.round(((open24h - openPrev24h) / openPrev24h) * 1000) / 10;
        openDeltaStr = `${openDelta >= 0 ? "+" : ""}${openDelta}%`;
        // For backlog tickets, a decrease is positive (fewer open tickets)
        openIsPositive = openDelta <= 0;
      } else if (open24h > 0) {
        openDelta = 100;
        openDeltaStr = "+100%";
        openIsPositive = false;
      } else if (openRows.length > 0) {
        openDelta = 0;
        openDeltaStr = "0%";
        openIsPositive = true;
      }

      setActiveOpen({
        value: activeOpenCount,
        formattedValue: String(activeOpenCount),
        deltaPercent: openDelta,
        formattedDelta: openDeltaStr,
        isPositive: openIsPositive,
      });

      // ──────────────────────────────────────────────
      // 2. AI Autonomous Resolved: COUNT WHERE status IN ('AI Resolved', 'Resolved')
      // ──────────────────────────────────────────────
      const resolvedRows = rows.filter(
        (r) => r.status === "AI Resolved" || r.status === "Resolved"
      );
      const resolvedCount = resolvedRows.length;

      const resolved24h = resolvedRows.filter((r) => {
        const timeStr = r.resolved_at || r.created_at;
        if (!timeStr) return false;
        const time = new Date(timeStr).getTime();
        return time >= t24h;
      }).length;

      const resolvedPrev24h = resolvedRows.filter((r) => {
        const timeStr = r.resolved_at || r.created_at;
        if (!timeStr) return false;
        const time = new Date(timeStr).getTime();
        return time >= t48h && time < t24h;
      }).length;

      let resolvedDelta: number | null = null;
      let resolvedDeltaStr = "—";
      let resolvedIsPositive = true;

      if (resolvedPrev24h > 0) {
        resolvedDelta =
          Math.round(((resolved24h - resolvedPrev24h) / resolvedPrev24h) * 1000) / 10;
        resolvedDeltaStr = `${resolvedDelta >= 0 ? "+" : ""}${resolvedDelta}%`;
        resolvedIsPositive = resolvedDelta >= 0;
      } else if (resolved24h > 0) {
        resolvedDelta = 100;
        resolvedDeltaStr = "+100%";
        resolvedIsPositive = true;
      } else if (resolvedRows.length > 0) {
        resolvedDelta = 0;
        resolvedDeltaStr = "0%";
        resolvedIsPositive = true;
      }

      setAiResolved({
        value: resolvedCount,
        formattedValue: String(resolvedCount),
        deltaPercent: resolvedDelta,
        formattedDelta: resolvedDeltaStr,
        isPositive: resolvedIsPositive,
      });

      // ──────────────────────────────────────────────
      // 3. Avg Response Latency: AVG(resolved_at - created_at) for resolved tickets
      // ──────────────────────────────────────────────
      const resolvedWithTimestamps24h = resolvedRows.filter((r) => {
        if (!r.created_at) return false;
        const resTime = r.resolved_at
          ? new Date(r.resolved_at).getTime()
          : new Date(r.created_at).getTime();
        return resTime >= t24h;
      });

      const sampleForLatency =
        resolvedWithTimestamps24h.length > 0
          ? resolvedWithTimestamps24h
          : resolvedRows.filter((r) => r.created_at);

      let avgSec: number | null = null;
      let formattedLatency = "—";

      if (sampleForLatency.length > 0) {
        const latenciesSec = sampleForLatency.map((r) => {
          const res = r.resolved_at ? new Date(r.resolved_at).getTime() : new Date().getTime();
          const cre = new Date(r.created_at!).getTime();
          return Math.max(0.5, (res - cre) / 1000);
        });
        avgSec =
          Math.round((latenciesSec.reduce((a, b) => a + b, 0) / latenciesSec.length) * 10) / 10;

        formattedLatency = avgSec < 60 ? `${avgSec.toFixed(1)}s` : `${(avgSec / 60).toFixed(1)}m`;
      }

      const prevLatencyRows = resolvedRows.filter((r) => {
        if (!r.created_at || !r.resolved_at) return false;
        const res = new Date(r.resolved_at).getTime();
        return res >= t48h && res < t24h;
      });

      let latencyDelta: number | null = null;
      let latencyDeltaStr = "—";
      let latencyIsPositive = true;

      if (prevLatencyRows.length > 0 && avgSec !== null) {
        const prevLats = prevLatencyRows.map(
          (r) => (new Date(r.resolved_at!).getTime() - new Date(r.created_at!).getTime()) / 1000
        );
        const avgPrev = prevLats.reduce((a, b) => a + b, 0) / prevLats.length;
        if (avgPrev > 0) {
          latencyDelta = Math.round(((avgSec - avgPrev) / avgPrev) * 1000) / 10;
          latencyDeltaStr = `${latencyDelta >= 0 ? "+" : ""}${latencyDelta}%`;
          latencyIsPositive = latencyDelta <= 0;
        }
      }

      setAvgLatency({
        value: avgSec,
        formattedValue: formattedLatency,
        deltaPercent: latencyDelta,
        formattedDelta: latencyDeltaStr,
        isPositive: latencyIsPositive,
      });

      // ──────────────────────────────────────────────
      // 4. CSAT & Quality: ROUND(AVG(confidence_score), 1) for last 24h
      // ──────────────────────────────────────────────
      const scores24h = rows
        .filter((r) => {
          if (r.confidence_score == null || isNaN(Number(r.confidence_score))) return false;
          if (!r.created_at) return false;
          return new Date(r.created_at).getTime() >= t24h;
        })
        .map((r) => {
          const raw = Number(r.confidence_score);
          return raw > 1 ? raw : raw * 100;
        });

      const allScores = rows
        .filter((r) => r.confidence_score != null && !isNaN(Number(r.confidence_score)))
        .map((r) => {
          const raw = Number(r.confidence_score);
          return raw > 1 ? raw : raw * 100;
        });

      const effectiveScores = scores24h.length > 0 ? scores24h : allScores;

      let csatValue: number | null = null;
      let formattedCsat = "—";

      if (effectiveScores.length > 0) {
        csatValue =
          Math.round(
            (effectiveScores.reduce((a, b) => a + b, 0) / effectiveScores.length) * 10
          ) / 10;
        formattedCsat = `${csatValue.toFixed(1)}%`;
      }

      const prevScores = rows
        .filter((r) => {
          if (r.confidence_score == null || isNaN(Number(r.confidence_score))) return false;
          if (!r.created_at) return false;
          const t = new Date(r.created_at).getTime();
          return t >= t48h && t < t24h;
        })
        .map((r) => {
          const raw = Number(r.confidence_score);
          return raw > 1 ? raw : raw * 100;
        });

      let csatDelta: number | null = null;
      let csatDeltaStr = "—";
      let csatIsPositive = true;

      if (prevScores.length > 0 && csatValue !== null) {
        const avgPrev = prevScores.reduce((a, b) => a + b, 0) / prevScores.length;
        if (avgPrev > 0) {
          csatDelta = Math.round(((csatValue - avgPrev) / avgPrev) * 1000) / 10;
          csatDeltaStr = `${csatDelta >= 0 ? "+" : ""}${csatDelta}%`;
          csatIsPositive = csatDelta >= 0;
        }
      }

      setCsat({
        value: csatValue,
        formattedValue: formattedCsat,
        deltaPercent: csatDelta,
        formattedDelta: csatDeltaStr,
        isPositive: csatIsPositive,
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error("[useTelemetry] Unexpected calculation error:", err);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();

    const interval = setInterval(() => {
      fetchTelemetry();
    }, 30000);

    const channelId = `telemetry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    let activeChannel: ReturnType<typeof supabase.channel> | null = null;

    try {
      activeChannel = supabase
        .channel(channelId)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "operational_tickets" },
          () => {
            fetchTelemetry();
          }
        );

      activeChannel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`[useTelemetry] Realtime channel ${channelId} active`);
        }
      });
    } catch (subErr) {
      console.warn("[useTelemetry] Channel subscription error:", subErr);
    }

    return () => {
      clearInterval(interval);
      if (activeChannel) {
        try {
          supabase.removeChannel(activeChannel);
        } catch (unsubErr) {
          console.warn("[useTelemetry] Error cleaning up channel:", unsubErr);
        }
      }
    };
  }, [fetchTelemetry]);

  return {
    activeOpen,
    aiResolved,
    avgLatency,
    csat,
    isLoading,
    lastUpdated,
    refresh: fetchTelemetry,
  };
}
