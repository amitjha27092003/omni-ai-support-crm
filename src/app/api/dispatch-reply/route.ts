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

function handleTelegramError(data: { description?: string; [key: string]: unknown }) {
  const desc = (data.description || "").toLowerCase();
  console.error("[dispatch-reply] Telegram API error:", data);
  if (desc.includes("chat not found")) {
    return NextResponse.json(
      { error: "User's chat not found. They may need to /start the bot." },
      { status: 400 }
    );
  }
  if (desc.includes("blocked by the user")) {
    return NextResponse.json(
      { error: "Customer blocked the bot." },
      { status: 400 }
    );
  }
  return NextResponse.json(
    { error: data.description || "Failed to deliver message via Telegram" },
    { status: 502 }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ticketId } = body;
    const message = body.text || body.message;

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

    const isWebChat = ticket.channel === "WebChat";
    let telegramMessageId: number | null = null;

    if (!isWebChat) {
      const numericChatId =
        ticket.chat_id != null && String(ticket.chat_id).trim() !== ""
          ? String(ticket.chat_id).trim()
          : body.chatId && /^\d+$/.test(String(body.chatId))
          ? String(body.chatId)
          : null;

      // Validate that numeric chat_id is present for Telegram
      if (!numericChatId) {
        console.warn(`[dispatch-reply] Missing chat_id for ticket ${ticketId}`);
        return NextResponse.json(
          { error: "User hasn't started the bot yet. Ask them to send /start." },
          { status: 400 }
        );
      }

      // Dispatch message to Telegram Bot API with numeric chat_id
      console.log("[dispatch-reply] Telegram request:", {
        chat_id: numericChatId,
        text: message,
        parse_mode: "Markdown",
      });

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
        console.log("[dispatch-reply] Telegram response (attempt 1):", telegramData);

        if (!telegramData.ok) {
          const desc = (telegramData.description || "").toLowerCase();
          // Fallback to plain text in case of markdown formatting issues
          if (desc.includes("can't parse entities") || desc.includes("markdown")) {
            console.log("[dispatch-reply] Retrying with plain text...");
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
            console.log("[dispatch-reply] Telegram response (attempt 2):", retryData);

            if (!retryData.ok) {
              return handleTelegramError(retryData);
            }
            telegramMessageId = retryData.result?.message_id || null;
          } else {
            return handleTelegramError(telegramData);
          }
        } else {
          telegramMessageId = telegramData.result?.message_id || null;
        }
      } catch (fetchErr: unknown) {
        const errMsg = fetchErr instanceof Error ? fetchErr.message : "Telegram network error";
        console.error("[dispatch-reply] Telegram fetch failed:", fetchErr);
        return NextResponse.json({ error: errMsg }, { status: 500 });
      }
    } else {
      console.log(`[dispatch-reply] Dispatching directly to WebChat customer for ticket ${ticketId}`);
    }

    // Insert agent message into ticket_messages for realtime sync to /support
    try {
      await supabaseAdmin.from("ticket_messages").insert({
        ticket_id: ticketId,
        sender: "agent",
        content: message,
      });
      console.log(`[dispatch-reply] Inserted agent message into ticket_messages for ticket ${ticketId}`);
    } catch (msgErr) {
      console.warn("[dispatch-reply] ticket_messages insert note:", msgErr);
    }

    // Update ticket in Supabase with Resolved status and outbound message
    const now = new Date().toISOString();
    const { error: updateErr } = await supabaseAdmin
      .from("operational_tickets")
      .update({
        status: "Resolved",
        ai_reply: message,
        resolved_at: now,
      })
      .eq("id", ticketId);

    if (updateErr) {
      console.warn(
        "[dispatch-reply] Update with resolved_at failed, falling back without resolved_at:",
        updateErr.message
      );
      await supabaseAdmin
        .from("operational_tickets")
        .update({
          status: "Resolved",
          ai_reply: message,
        })
        .eq("id", ticketId);
    }

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
