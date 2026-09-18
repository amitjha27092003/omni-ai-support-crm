import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ticketId, customerName = "Customer" } = body;
    const conversation = body.conversation || body.query || body.customerMessage || "";

    if (!conversation) {
      return NextResponse.json({ error: "Conversation text is required" }, { status: 400 });
    }

    const systemPrompt = `You are OmniAI, a polite, concise customer support agent for an Indian SaaS company. Reply in the same language the customer used (Hindi, English, or Hinglish). Keep replies under 4 sentences. Never invent policies. If unsure, say "Let me check with the team."`;

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `${systemPrompt}\n\nCustomer name: ${customerName}\n\nConversation:\n${conversation}\n\nDraft the next reply:`,
          },
        ],
      },
    ];

    const apiKey = process.env.GEMINI_API_KEY || "";

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents,
        });

        if (response.text) {
          return NextResponse.json({ draft: response.text.trim() });
        }
      } catch (geminiError: unknown) {
        console.warn("[generate-reply] Gemini API call error:", geminiError);
        // If API key is invalid or quota exceeded, produce a contextual smart fallback
        const lower = conversation.toLowerCase();
        let fallback = `Namaste ${customerName}, we have received your query regarding "${conversation.slice(0, 40)}...". Our ops team is actively investigating this on priority.`;
        if (lower.includes("refund") || lower.includes("money") || lower.includes("payment")) {
          fallback = `Namaste ${customerName}, your transaction has been identified and forwarded to billing clearance. We will notify you here once reconciled.`;
        } else if (lower.includes("invoice") || lower.includes("gst")) {
          fallback = `Namaste ${customerName}, your GST tax invoice request has been logged. We will issue your updated invoice to this thread shortly.`;
        } else if (lower.includes("urgent") || lower.includes("agent") || lower.includes("help")) {
          fallback = `Hello ${customerName}, your request has been marked as high priority and assigned to a Tier-2 operations specialist.`;
        }

        return NextResponse.json({
          draft: fallback,
          isFallback: true,
          notice: "Draft generated via contextual heuristic (Gemini API key verification pending).",
        });
      }
    }

    // Default fallback if no apiKey provided
    return NextResponse.json({
      draft: `Hello ${customerName}, thank you for reaching out. We have logged your request and our operations team is reviewing it now.`,
      isFallback: true,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal generation error";
    console.error("[generate-reply] Error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}