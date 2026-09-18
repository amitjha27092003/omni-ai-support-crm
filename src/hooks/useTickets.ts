"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { detectLanguageHeuristic } from "@/lib/languageDetection";

export interface Ticket {
  id: string;
  channel: "WhatsApp" | "Telegram" | "Email" | "Lark" | string;
  customer_name: string;
  customer_handle?: string | null;
  customer: string; // Formatted display name + handle
  original_message: string;
  sanitized_message: string;
  message: string; // Primary display text: sanitized_message || original_message
  category_slug?: string | null;
  status: "Pending" | "Open" | "AI In-Progress" | "In Progress" | "AI Resolved" | "Escalated" | "Resolved" | string;
  confidence_score: number;
  confidence: number;
  priority: "High" | "Medium" | "Low";
  sentiment_trajectory?: string | null;
  sentiment: "Frustrated" | "Urgent" | "Neutral" | "Positive" | string;
  slaMinutesLeft: number;
  rag_grounding_ref?: string | null;
  executed_tool?: string | null;
  zkp_proof_hash?: string | null;
  kb_context?: string;
  ai_reply: string;
  suggested_reply: string;
  created_at: string;
  resolved_at?: string | null;
  chat_id?: string | number | null;
  detected_language?: string | null;
  detected_language_iso?: string | null;
  english_translation?: string | null;
  target_response_language?: string | null;
  tool_action?: {
    toolName: string;
    actionTaken: boolean;
    message: string;
  };
}

export const mapDbTicketToUi = (dbRow: Record<string, any>): Ticket => {
  const sanitized = dbRow.sanitized_message || "";
  const original = dbRow.original_message || "";
  const displayText = sanitized || original || "";
  const rawStatus = dbRow.status || "Pending";

  const customerName = dbRow.customer_name || "Telegram User";
  const customerHandle = dbRow.customer_handle || "";
  const customerDisplay = customerHandle ? `${customerName} (${customerHandle})` : customerName;

  const confidenceScore = Number(dbRow.confidence_score) || 0;
  const isResolved = rawStatus === "Resolved" || rawStatus === "AI Resolved";

  return {
    id: dbRow.id,
    channel: dbRow.channel || "Telegram",
    customer_name: customerName,
    customer_handle: customerHandle,
    customer: customerDisplay,
    original_message: original,
    sanitized_message: sanitized,
    message: displayText,
    category_slug: dbRow.category_slug || null,
    status: rawStatus,
    confidence_score: confidenceScore,
    confidence: confidenceScore,
    priority: rawStatus === "Escalated" ? "High" : "Medium",
    sentiment_trajectory: dbRow.sentiment_trajectory || "Neutral",
    sentiment: dbRow.sentiment_trajectory || "Neutral",
    slaMinutesLeft: isResolved ? 0 : 15,
    rag_grounding_ref: dbRow.rag_grounding_ref || null,
    executed_tool: dbRow.executed_tool || null,
    zkp_proof_hash: dbRow.zkp_proof_hash || null,
    kb_context: dbRow.zkp_proof_hash
      ? `ZKP Hash: ${dbRow.zkp_proof_hash}`
      : dbRow.rag_grounding_ref || undefined,
    ai_reply: dbRow.ai_reply || "",
    suggested_reply: dbRow.ai_reply || "",
    created_at: dbRow.created_at || new Date().toISOString(),
    resolved_at: dbRow.resolved_at || null,
    chat_id: dbRow.chat_id ? String(dbRow.chat_id) : null,
    detected_language:
      dbRow.detected_language || detectLanguageHeuristic(displayText).name,
    detected_language_iso:
      dbRow.detected_language_iso || detectLanguageHeuristic(displayText).iso,
    english_translation: dbRow.english_translation || null,
    target_response_language: dbRow.target_response_language || "auto",
    tool_action: dbRow.executed_tool
      ? {
          toolName: dbRow.executed_tool,
          actionTaken: true,
          message: "Autonomously executed via ops agent",
        }
      : undefined,
  };
};

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [syncMode, setSyncMode] = useState<"realtime" | "polling" | "failed">("realtime");
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setError(null);
      console.log("[useTickets] Fetching initial 100 tickets with multilingual projection...");
      
      // Try full multilingual projection first
      let data: any[] | null = null;
      let queryError: { message: string } | null = null;

      const res = await supabase
        .from("operational_tickets")
        .select(
          "id, channel, customer_name, customer_handle, original_message, sanitized_message, category_slug, status, confidence_score, ai_reply, created_at, resolved_at, chat_id, detected_language, detected_language_iso, english_translation, target_response_language"
        )
        .order("created_at", { ascending: false })
        .limit(100);

      // If migration 004 has not yet been run, fallback to standard columns
      if (res.error && res.error.message.includes("column")) {
        console.warn("[useTickets] Falling back to baseline columns while migration 004 is pending...");
        const fallbackRes = await supabase
          .from("operational_tickets")
          .select(
            "id, channel, customer_name, customer_handle, original_message, sanitized_message, category_slug, status, confidence_score, ai_reply, created_at, resolved_at, chat_id"
          )
          .order("created_at", { ascending: false })
          .limit(100);
        data = fallbackRes.data;
        queryError = fallbackRes.error;
      } else {
        data = res.data;
        queryError = res.error;
      }

      if (queryError) {
        console.error("[useTickets] Supabase fetch error:", queryError);
        setError(queryError.message);
        setSyncMode("polling");
        return;
      }

      if (data) {
        console.log(`[useTickets] Successfully loaded ${data.length} tickets from Supabase`);
        const mapped = data.map(mapDbTicketToUi);
        setTickets(mapped);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown fetch error";
      console.error("[useTickets] Fetch failed:", err);
      setError(msg);
      setSyncMode("failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();

    console.log("[useTickets] Subscribing to realtime channel: tickets-live");
    const channel = supabase
      .channel("tickets-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "operational_tickets" },
        (payload) => {
          console.log("[useTickets] Realtime payload received:", payload);
          if (payload.eventType === "INSERT") {
            const newTicket = mapDbTicketToUi(payload.new);
            setTickets((prev) => [newTicket, ...prev.filter((t) => t.id !== newTicket.id)]);
          } else if (payload.eventType === "UPDATE") {
            const updated = mapDbTicketToUi(payload.new);
            setTickets((prev) =>
              prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
            );
          } else if (payload.eventType === "DELETE") {
            const oldId = payload.old?.id;
            if (oldId) {
              setTickets((prev) => prev.filter((t) => t.id !== oldId));
            }
          }
        }
      )
      .subscribe((status) => {
        console.log("[useTickets] Realtime subscription status:", status);
        if (status === "SUBSCRIBED") {
          setSyncMode("realtime");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("[useTickets] Realtime error or timed out, switching to polling");
          setSyncMode("polling");
        }
      });

    channelRef.current = channel;

    // Resilient periodic sync every 5 seconds to catch any network lapses
    const interval = setInterval(() => {
      fetchTickets();
    }, 5000);

    return () => {
      if (channelRef.current) {
        console.log("[useTickets] Cleaning up channel subscription");
        supabase.removeChannel(channelRef.current);
      }
      clearInterval(interval);
    };
  }, [fetchTickets]);

  return {
    tickets,
    setTickets,
    loading,
    error,
    refetch: fetchTickets,
    syncMode,
  };
}
