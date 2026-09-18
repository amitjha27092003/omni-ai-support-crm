import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { ingestMessage } from '@/lib/ingestMessage';

const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || '8600882660:AAFbSJEpimvWuLls5jsaEBXE4JmG7hfKzSc';
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bpgrpmdjpdydmlonbeag.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZ3JwbWRqcGR5ZG1sb25iZWFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0NDEzNSwiZXhwIjoyMTA1MjIwMTM1fQ.IS-4Da9UsTAG9hXvBabiA8Tal_dCTMVF5Ap04T3nnDw';

function sanitizePII(text: string) {
  let masked = text;
  masked = masked.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[VAULT_SEC_EMAIL]');
  masked = masked.replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[VAULT_SEC_PHONE]');
  masked = masked.replace(/\b(?:\d[ -]*?){13,16}\b/g, '[VAULT_SEC_CARD]');
  return masked;
}

export async function POST(req: Request) {
  try {
    const update = await req.json();
    console.log('[Telegram Webhook] Full update payload:', JSON.stringify(update, null, 2));

    // 1. Inline Button Callback Handling
    if (update.callback_query) {
      const callback = update.callback_query;
      const callbackData = callback.data || '';
      const cbChatId = callback.message?.chat?.id;
      const callbackQueryId = callback.id;

      let newStatus = 'Open';
      let confirmationText = 'Status updated.';

      if (callbackData.startsWith('ack_')) {
        newStatus = 'Resolved';
        confirmationText = '✅ Ticket marked as Resolved by user.';
      } else if (callbackData.startsWith('agent_')) {
        newStatus = 'Escalated';
        confirmationText = '👤 Ticket escalated to a Human Agent.';
      }

      const ticketId = callbackData.split(':')[1];

      if (ticketId) {
        // Update ticket in Supabase
        await fetch(`${SUPABASE_URL}/rest/v1/operational_tickets?id=eq.${ticketId}`, {           method: 'PATCH',           headers: {             apikey: SUPABASE_SERVICE_ROLE_KEY,             Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal'
          },
          body: JSON.stringify({ status: newStatus })
        });
      }

      // Acknowledge callback to remove loading state in Telegram
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: confirmationText,
        }),
      });

      if (cbChatId) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: cbChatId,
            text: `🔔 *Update:* ${confirmationText}`,
            parse_mode: 'Markdown',
          }),
        });
      }

      return NextResponse.json({ ok: true });
    }

    // 2. Incoming Ticket Messages
    const msg = update.message || update.edited_message;
    if (!msg || !msg.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = msg.chat?.id;
    const rawText = msg.text;

    if (rawText.trim() === '/start') {
      if (chatId) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: '👋 *OmniAI Ops Bot Connected!*\n\nSend your issue or inquiry directly here.',
            parse_mode: 'Markdown',
          }),
        });
      }
      return NextResponse.json({ ok: true });
    }

    const firstName = msg.from?.first_name || '';
    const lastName = msg.from?.last_name || '';
    const senderName = (firstName + ' ' + lastName).trim() || 'Telegram User';
    const senderHandle = msg.from?.username ? '@' + msg.from.username : 'tg_' + chatId;

    // Unified Omnichannel Ingestion Pipeline
    const ingestResult = await ingestMessage({
      channel: 'Telegram',
      customerName: senderName,
      customerHandle: senderHandle,
      chatId: String(chatId),
      message: rawText,
    });

    const insertedId = ingestResult.ticketId;
    const replyMessage = ingestResult.aiReply;

    if (chatId) {
      let finalReply = replyMessage;
      if (executedTool) {
        finalReply += `\n\n⚡ *Autonomous Action:* \`${executedTool}\`\n🔐 *ZKP Proof:* \`${zkpHash}\``;
      }

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: finalReply,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Acknowledge', callback_data: `ack_${insertedId ? `:${insertedId}` : ''}` },
                { text: '👤 Human Agent', callback_data: `agent_${insertedId ? `:${insertedId}` : ''}` }
              ]
            ]
          }
        })
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('CRITICAL_WEBHOOK_HANDLER_ERROR:', err);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}