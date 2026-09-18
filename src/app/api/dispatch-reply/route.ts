import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || "8600882660:AAFbSJEpimvWuLls5jsaEBXE4JmG7hfKzSc";
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bpgrpmdjpdydmlonbeag.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZ3JwbWRqcGR5ZG1sb25iZWFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0NDEzNSwiZXhwIjoyMTA1MjIwMTM1fQ.IS-4Da9UsTAG9hXvBabiA8Tal_dCTMVF5Ap04T3nnDw";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ticketId, message } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    }

    if (!ticketId) {
      return NextResponse.json({ error: "ticketId is required" }, { status: 400 });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Read NUMERIC chat_id directly from DB for this ticket
    const { data: ticket, error: tckError } = await supabaseAdmin
      .from("operational_tickets")
      .select("id, chat_id, customer_handle, customer_name, channel")
      .eq("id", ticketId)
      .single();

    if (tckError || !ticket) {
      console.error("[dispatch-reply] Failed to fetch ticket:", tckError);
      return NextResponse.json({ error: "Ticket not found in database" }, { status: 404 });
    }

    const numericChatId = ticket.chat_id || (body.chatId && /^\d+$/.test(String(body.chatId)) ? String(body.chatId) : null);

    // Validate that numeric chat_id is present
    if (!numericChatId) {
      return NextResponse.json(
        { error: "User hasn't started the bot. Ask them to send /start." },
        { status: 400 }
      );
    }

    // Dispatch message to Telegram Bot API with numeric chat_id
    let telegramMessageId: number | null = null;
    try {
      const telegramRes = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: numericChatId,
            text: message,
            parse_mode: "Markdown",
          }),
        }
      );

      const telegramData = await telegramRes.json();
      if (!telegramData.ok) {
        // Fallback to plain text in case of markdown parsing issues
        const retryRes = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: numericChatId,
              text: message,
            }),
          }
        );
        const retryData = await retryRes.json();
        if (!retryData.ok) {
          console.error("[dispatch-reply] Telegram error:", retryData.description);
          return NextResponse.json(
            { error: retryData.description || "Failed to deliver message via Telegram" },
            { status: 500 }
          );
        }
        telegramMessageId = retryData.result?.message_id || null;
      } else {
        telegramMessageId = telegramData.result?.message_id || null;
      }
    } catch (fetchErr: unknown) {
      const errMsg = fetchErr instanceof Error ? fetchErr.message : "Telegram network error";
      console.error("[dispatch-reply] Telegram fetch failed:", fetchErr);
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }

    // Update ticket in Supabase with Resolved status and outbound message
    const now = new Date().toISOString();
    await supabaseAdmin
      .from("operational_tickets")
      .update({
        status: "Resolved",
        ai_reply: message,
        resolved_at: now,
      })
      .eq("id", ticketId);

    return NextResponse.json({
      success: true,
      telegramMessageId,
      deliveredAt: now,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[dispatch-reply] Handler error:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
