import { NextResponse } from "next/server";
import crypto from "crypto";
import { generateMultilingualTriage } from "@/lib/gemini";

export const dynamic = "force-dynamic";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bpgrpmdjpdydmlonbeag.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZ3JwbWRqcGR5ZG1sb25iZWFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0NDEzNSwiZXhwIjoyMTA1MjIwMTM1fQ.IS-4Da9UsTAG9hXvBabiA8Tal_dCTMVF5Ap04T3nnDw";

function sanitizePII(text: string) {
  let masked = text;
  masked = masked.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[VAULT_SEC_EMAIL]");
  masked = masked.replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, "[VAULT_SEC_PHONE]");
  masked = masked.replace(/\b(?:\d[ -]*?){13,16}\b/g, "[VAULT_SEC_CARD]");
  return masked;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      message,
      customerName = "Web Visitor",
      customerHandle = "web_portal",
      targetLanguage = "auto",
      sessionId,
    } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const rawText = message.trim();
    const sanitized = sanitizePII(rawText);
    const zkpHash =
      "zkp_" +
      crypto
        .createHash("sha256")
        .update(rawText + Date.now())
        .digest("hex")
        .substring(0, 16);

    // Multilingual AI Triage using Gemini 2.5
    const triage = await generateMultilingualTriage({
      customerMessage: sanitized,
      customerName,
      tone: "Formal",
      targetLanguage,
      channel: "WebChat",
    });

    const isRefund = /refund|money back|transaction|payment|paise|reembolso|استرداد|退款/i.test(sanitized);
    const isEscalation = /fraud|urgent|legal|human|agent|insan|madad/i.test(sanitized);

    let status = "AI Resolved";
    let executedTool = "stripe_recon_agent";

    if (!isRefund && isEscalation) {
      status = "Escalated";
      executedTool = "";
    } else if (!isRefund && !isEscalation) {
      status = "Pending";
      executedTool = "";
    }

    const dbPayload = {
      channel: "WebChat",
      customer_name: customerName,
      customer_handle: customerHandle,
      original_message: rawText,
      sanitized_message: sanitized,
      status: status,
      confidence_score: triage.confidence_score,
      executed_tool: executedTool || null,
      zkp_proof_hash: zkpHash,
      sentiment_trajectory: isEscalation ? "Urgent" : "Neutral",
      ai_reply: triage.suggested_reply,
      chat_id: sessionId || `web_${Date.now()}`,
      detected_language: triage.detected_language,
      detected_language_iso: triage.detected_language_iso,
      english_translation: triage.english_translation,
      target_response_language: targetLanguage,
    };

    let ticketId = "";
    try {
      let dbRes = await fetch(`${SUPABASE_URL}/rest/v1/operational_tickets`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(dbPayload),
      });

      // Graceful fallback if migration 004 is not yet executed in Supabase
      if (!dbRes.ok) {
        const errJson = await dbRes.clone().json().catch(() => ({}));
        if (errJson?.message && errJson.message.includes("column")) {
          const { detected_language, detected_language_iso, english_translation, target_response_language, ...legacyPayload } = dbPayload;
          dbRes = await fetch(`${SUPABASE_URL}/rest/v1/operational_tickets`, {
            method: "POST",
            headers: {
              apikey: SUPABASE_SERVICE_ROLE_KEY,
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              "Content-Type": "application/json",
              Prefer: "return=representation",
            },
            body: JSON.stringify(legacyPayload),
          });
        }
      }

      const resBody = await dbRes.json();
      if (Array.isArray(resBody) && resBody[0]?.id) {
        ticketId = resBody[0].id;
      }
    } catch (dbErr) {
      console.error("[webchat] Supabase insert error:", dbErr);
    }

    return NextResponse.json({
      success: true,
      ticketId,
      reply: triage.suggested_reply,
      reply_english: triage.suggested_reply_english,
      detected_language: triage.detected_language,
      detected_language_iso: triage.detected_language_iso,
      english_translation: triage.english_translation,
      is_rtl: triage.is_rtl,
      confidence_score: triage.confidence_score,
      status,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal webchat error";
    console.error("[webchat] Error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
