import { NextResponse } from "next/server";
import { generateMultilingualTriage } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      ticketId,
      customerName = "Customer",
      tone = "Formal",
      targetLanguage = "auto",
    } = body;
    const conversation = body.conversation || body.query || body.customerMessage || "";

    if (!conversation) {
      return NextResponse.json({ error: "Conversation text is required" }, { status: 400 });
    }

    const triage = await generateMultilingualTriage({
      customerMessage: conversation,
      customerName,
      tone,
      targetLanguage,
      channel: "Operations CRM",
    });

    return NextResponse.json({
      draft: triage.suggested_reply,
      tone,
      targetLanguage,
      detected_language: triage.detected_language,
      detected_language_iso: triage.detected_language_iso,
      english_translation: triage.english_translation,
      suggested_reply_english: triage.suggested_reply_english,
      confidence_score: triage.confidence_score,
      is_rtl: triage.is_rtl,
      isFallback: triage.is_fallback,
      ticketId,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal generation error";
    console.error("[generate-reply] Error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}