import { NextResponse } from "next/server";
import { ingestMessage } from "@/lib/ingestMessage";

export const dynamic = "force-dynamic";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "omni_whatsapp_verify_token";

// Verification endpoint for Meta WhatsApp Cloud API
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
    console.log("[WhatsApp Webhook] Verification challenge passed");
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Inbound webhook receiver
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[WhatsApp Webhook] Received payload:", JSON.stringify(body, null, 2));

    // Support both Meta WhatsApp Cloud API and Twilio webhook payloads
    let senderPhone = "";
    let senderName = "WhatsApp Customer";
    let messageText = "";

    // 1. Meta Cloud API format
    if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const value = body.entry[0].changes[0].value;
      const msg = value.messages[0];
      senderPhone = msg.from;
      senderName = value.contacts?.[0]?.profile?.name || `wa_${senderPhone}`;
      messageText = msg.text?.body || msg.caption || "[Media Message]";
    }
    // 2. Twilio WhatsApp format
    else if (body.From && (body.Body || body.message)) {
      senderPhone = String(body.From).replace("whatsapp:", "");
      senderName = body.ProfileName || `wa_${senderPhone}`;
      messageText = body.Body || body.message || "";
    }
    // 3. Fallback generic format
    else if (body.phone && body.message) {
      senderPhone = String(body.phone);
      senderName = body.name || `wa_${senderPhone}`;
      messageText = body.message;
    }

    if (!messageText || !senderPhone) {
      console.log("[WhatsApp Webhook] No actionable message content, acknowledging receipt");
      return NextResponse.json({ ok: true, status: "ignored" });
    }

    // Unified Omnichannel Ingestion Pipeline
    const result = await ingestMessage({
      channel: "WhatsApp",
      customerName: senderName,
      customerHandle: `+${senderPhone.replace(/\+/g, "")}`,
      chatId: senderPhone,
      message: messageText,
    });

    console.log(`[WhatsApp Webhook] Ticket created: ${result.ticketId}`);

    // Outbound dispatch to WhatsApp Cloud API (or dry run log)
    if (WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
      try {
        await fetch(
          `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${WHATSAPP_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: senderPhone,
              text: { body: result.aiReply },
            }),
          }
        );
      } catch (waErr) {
        console.warn("[WhatsApp Webhook] Cloud API dispatch note:", waErr);
      }
    } else {
      console.log("[WhatsApp Webhook] Dry-run auto-reply dispatch logged (WHATSAPP_TOKEN placeholder)");
    }

    return NextResponse.json({
      success: true,
      ticketId: result.ticketId,
      channel: "WhatsApp",
      aiReply: result.aiReply,
    });
  } catch (err: any) {
    console.error("[WhatsApp Webhook] Handler error:", err);
    return NextResponse.json({ error: err.message || "WhatsApp webhook error" }, { status: 500 });
  }
}
