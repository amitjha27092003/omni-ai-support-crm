import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import { maskPII } from "./piiMasking";
import { buildMultilingualPrompt, parseGeminiJSON } from "./geminiPrompt";
import { generateMultilingualTriage } from "./gemini";

export interface IngestPayload {
  channel: "WebChat" | "Telegram" | "WhatsApp" | "Email" | "Lark" | string;
  customerName: string;
  customerHandle?: string | null;
  chatId: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface IngestResult {
  ticketId: string;
  aiReply: string;
  detectedLanguage: string;
  detectedLanguageIso: string;
  englishTranslation: string;
  channel: string;
  chatId: string;
  status: string;
}

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bpgrpmdjpdydmlonbeag.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZ3JwbWRqcGR5ZG1sb25iZWFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0NDEzNSwiZXhwIjoyMTA1MjIwMTM1fQ.IS-4Da9UsTAG9hXvBabiA8Tal_dCTMVF5Ap04T3nnDw";

export async function ingestMessage(payload: IngestPayload): Promise<IngestResult> {
  console.log(`[ingestMessage] === INGESTION START [${payload.channel}] ===`);
  console.log(`[ingestMessage] Sender: ${payload.customerName} (${payload.customerHandle || "no_handle"}) | ChatId: ${payload.chatId}`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // 1. Mask PII with Zero-Knowledge tags
  const sanitized = maskPII(payload.message);

  // 2. Multilingual AI Triage with Gemini 2.5 Flash
  let parsed = {
    detected_language: "English",
    detected_language_iso: "en",
    english_translation: "",
    suggested_reply: "Thank you for reaching out. OmniAI Operations has received your request.",
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = buildMultilingualPrompt(sanitized, payload.customerName);
      const aiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      });

      const responseText = aiResponse.text || "";
      parsed = parseGeminiJSON(responseText);
      console.log(`[ingestMessage] Gemini 2.5 identified: ${parsed.detected_language} [${parsed.detected_language_iso}]`);
    } else {
      // Fallback to internal triage engine
      const fallbackTriage = await generateMultilingualTriage({
        customerMessage: sanitized,
        customerName: payload.customerName,
        channel: payload.channel,
      });
      parsed = {
        detected_language: fallbackTriage.detected_language,
        detected_language_iso: fallbackTriage.detected_language_iso,
        english_translation: fallbackTriage.english_translation,
        suggested_reply: fallbackTriage.suggested_reply,
      };
    }
  } catch (aiErr) {
    console.warn("[ingestMessage] Gemini call failed, using rule-based fallback triage:", aiErr);
    const fallbackTriage = await generateMultilingualTriage({
      customerMessage: sanitized,
      customerName: payload.customerName,
      channel: payload.channel,
    });
    parsed = {
      detected_language: fallbackTriage.detected_language,
      detected_language_iso: fallbackTriage.detected_language_iso,
      english_translation: fallbackTriage.english_translation,
      suggested_reply: fallbackTriage.suggested_reply,
    };
  }

  // 3. Prepare ticket insert payload
  // Notice: If chat_id column in Postgres is still 'bigint', non-numeric UUIDs cause a 22P02 syntax error.
  // We handle both gracefully: first try with provided chatId; if bigint collision occurs, fallback to numeric Date.now().
  const isNumericChatId = /^\d+$/.test(String(payload.chatId));
  let finalChatId: string | number | null = payload.chatId;

  const ticketData = {
    channel: payload.channel,
    customer_name: payload.customerName || "Global Visitor",
    customer_handle: payload.customerHandle || null,
    original_message: payload.message,
    sanitized_message: sanitized,
    chat_id: finalChatId,
    status: "Open",
    confidence_score: 92,
    ai_reply: parsed.suggested_reply,
    detected_language: parsed.detected_language,
    detected_language_iso: parsed.detected_language_iso,
    english_translation: parsed.english_translation,
    target_response_language: "auto",
  };

  let ticket: any = null;
  let { data: insertedTicket, error: ticketError } = await supabase
    .from("operational_tickets")
    .insert(ticketData)
    .select()
    .single();

  // If Postgres rejected because chat_id is bigint and chatId is a UUID string
  if (ticketError && (ticketError.code === "22P02" || ticketError.message.includes("bigint"))) {
    console.warn("[ingestMessage] chat_id is typed as bigint in DB. Falling back to numeric ID...");
    finalChatId = isNumericChatId ? payload.chatId : Date.now();
    const fallbackTicketData = { ...ticketData, chat_id: finalChatId };

    const retryRes = await supabase
      .from("operational_tickets")
      .insert(fallbackTicketData)
      .select()
      .single();

    insertedTicket = retryRes.data;
    ticketError = retryRes.error;
  }

  // If missing migration 004 columns
  if (ticketError && ticketError.message.includes("column")) {
    console.warn("[ingestMessage] Retrying without new columns (migration 004 pending)...");
    const { detected_language, detected_language_iso, english_translation, target_response_language, ...legacyData } = ticketData;
    const retryRes = await supabase
      .from("operational_tickets")
      .insert(legacyData)
      .select()
      .single();

    insertedTicket = retryRes.data;
    ticketError = retryRes.error;
  }

  if (ticketError || !insertedTicket) {
    console.error("[ingestMessage] Ticket insert failed:", ticketError);
    throw new Error(`Ticket insert failed: ${ticketError?.message || "Unknown database error"}`);
  }

  ticket = insertedTicket;
  console.log(`[ingestMessage] Ticket successfully created in DB: ${ticket.id} [Channel: ${payload.channel}]`);

  // 4. Insert into ticket_messages for realtime conversation streaming
  try {
    const { error: msgErr } = await supabase.from("ticket_messages").insert([
      {
        ticket_id: ticket.id,
        sender: "customer",
        content: sanitized,
        language: parsed.detected_language_iso,
      },
      {
        ticket_id: ticket.id,
        sender: "ai",
        content: parsed.suggested_reply,
        language: parsed.detected_language_iso,
      },
    ]);

    if (msgErr) {
      console.warn("[ingestMessage] ticket_messages insert note:", msgErr.message);
    } else {
      console.log(`[ingestMessage] Realtime messages inserted for ticket: ${ticket.id}`);
    }
  } catch (err) {
    console.warn("[ingestMessage] ticket_messages table might be pending migration 005:", err);
  }

  return {
    ticketId: ticket.id,
    aiReply: parsed.suggested_reply,
    detectedLanguage: parsed.detected_language,
    detectedLanguageIso: parsed.detected_language_iso,
    englishTranslation: parsed.english_translation,
    channel: payload.channel,
    chatId: String(finalChatId || payload.chatId),
    status: "Open",
  };
}
