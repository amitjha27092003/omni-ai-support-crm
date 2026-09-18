import { NextResponse } from "next/server";
import { ingestMessage } from "@/lib/ingestMessage";

export const dynamic = "force-dynamic";

const EMAIL_WEBHOOK_SECRET = process.env.EMAIL_WEBHOOK_SECRET || "";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[Email Webhook] Inbound email payload received");

    // Support SendGrid, Postmark, Resend, or standard inbound email JSON
    let fromEmail = "";
    let fromName = "Email Customer";
    let subject = "";
    let textBody = "";

    // 1. Postmark format
    if (body.From && body.TextBody) {
      fromEmail = body.From;
      fromName = body.FromName || body.From.split("<")[0].trim() || "Email Customer";
      subject = body.Subject || "";
      textBody = body.TextBody;
    }
    // 2. SendGrid format
    else if (body.from && (body.text || body.subject)) {
      fromEmail = body.from;
      fromName = body.from.split("<")[0].trim() || "Email Customer";
      subject = body.subject || "";
      textBody = body.text || body.html || "";
    }
    // 3. Resend / Generic format
    else if (body.data?.from || body.email || body.message) {
      fromEmail = body.data?.from || body.email || "visitor@omni.ai";
      fromName = body.data?.name || body.name || fromEmail.split("@")[0];
      subject = body.data?.subject || body.subject || "Support Inquiry";
      textBody = body.data?.text || body.message || "";
    }

    if (!textBody) {
      return NextResponse.json({ error: "No email body content found" }, { status: 400 });
    }

    const fullMessage = subject ? `[Subject: ${subject}]\n\n${textBody}` : textBody;

    // Unified Omnichannel Ingestion Pipeline
    const result = await ingestMessage({
      channel: "Email",
      customerName: fromName,
      customerHandle: fromEmail,
      chatId: fromEmail,
      message: fullMessage,
      metadata: { subject },
    });

    console.log(`[Email Webhook] Ticket created: ${result.ticketId}`);

    // Outbound email dispatch (or dry-run log)
    if (EMAIL_WEBHOOK_SECRET && process.env.RESEND_API_KEY) {
      console.log(`[Email Webhook] Outbound email triggered to ${fromEmail}`);
      // TODO: Connect Resend / SendGrid SDK when API key is provisioned
    } else {
      console.log(`[Email Webhook] Dry-run auto-reply dispatch logged (target: ${fromEmail})`);
    }

    return NextResponse.json({
      success: true,
      ticketId: result.ticketId,
      channel: "Email",
      aiReply: result.aiReply,
    });
  } catch (err: any) {
    console.error("[Email Webhook] Handler error:", err);
    return NextResponse.json({ error: err.message || "Email webhook error" }, { status: 500 });
  }
}
