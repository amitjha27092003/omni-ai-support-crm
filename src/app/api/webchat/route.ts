import { NextResponse } from "next/server";
import crypto from "crypto";
import { ingestMessage } from "@/lib/ingestMessage";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, customerName, name, customerHandle, chatId, sessionId, targetLanguage } = body;

    const actualMessage = message?.trim();
    if (!actualMessage) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const finalName = (customerName || name || "Web Visitor").trim();
    const finalChatId = chatId || sessionId || crypto.randomUUID();

    console.log("[webchat] === REQUEST ===");
    console.log("[webchat] Payload:", { message: actualMessage, name: finalName, chatId: finalChatId });

    const result = await ingestMessage({
      channel: "WebChat",
      customerName: finalName,
      customerHandle: customerHandle || `@${finalName.toLowerCase().replace(/\s+/g, "_")}`,
      chatId: String(finalChatId),
      message: actualMessage,
      metadata: { targetLanguage },
    });

    console.log("[webchat] Ingestion result:", {
      ticketId: result.ticketId,
      chatId: result.chatId,
      language: result.detectedLanguage,
    });

    return NextResponse.json({
      success: true,
      ticketId: result.ticketId,
      chatId: result.chatId,
      reply: result.aiReply,
      reply_english: result.englishTranslation,
      detected_language: result.detectedLanguage,
      detected_language_iso: result.detectedLanguageIso,
      english_translation: result.englishTranslation,
      status: "Open",
    });
  } catch (error: any) {
    console.error("[webchat] FAILED:", error);
    return NextResponse.json(
      { error: error.message || "Internal WebChat ingestion error" },
      { status: 500 }
    );
  }
}
