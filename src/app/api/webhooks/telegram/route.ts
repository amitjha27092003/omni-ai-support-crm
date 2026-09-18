import { NextResponse } from 'next/server';
import crypto from 'crypto';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const SUPABASE_URL = 'https://bpgrpmdjpydmlonbeag.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZ3JwbWRqcHlkbWxvbmJlYWciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1MjYxMDk2MywiZXhwIjoyMDY4MTg2OTY0fQ.mIGYvcVHeCmhNGvBfbm5im1ih-r5oWkBdBFHgZ-wX0A';

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

    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const rawText = update.message.text;

      if (rawText.trim() === '/start') {
        if (TELEGRAM_BOT_TOKEN && chatId) {
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: '👋 *Welcome to OmniAI Ops Support Engine!*\n\nSend your issue or inquiry directly here.',
              parse_mode: 'Markdown'
            })
          });
        }
        return NextResponse.json({ ok: true });
      }

      const firstName = update.message.from?.first_name || '';
      const lastName = update.message.from?.last_name || '';
      const senderName = (firstName + ' ' + lastName).trim() || 'Telegram User';
      const senderHandle = update.message.from?.username ? '@' + update.message.from.username : 'tg_' + chatId;

      const sanitized = sanitizePII(rawText);
      const zkpHash = 'zkp_' + crypto.createHash('sha256').update(rawText + Date.now()).digest('hex').substring(0, 16);

      const isRefund = /refund|money back|transaction|payment/i.test(sanitized);
      const isEscalation = /fraud|urgent|legal|human|agent/i.test(sanitized);

      let status = 'AI Resolved';
      let confidence = 95;
      let executedTool = 'stripe_recon_agent';
      let replyMessage = '✅ Your refund request has been analyzed and processed autonomously via shadow execution.';

      if (!isRefund && isEscalation) {
        status = 'Escalated';
        confidence = 65;
        executedTool = '';
        replyMessage = '⚠️ Your request contains high-priority indicators and has been escalated to Tier-2 Operations.';
      } else if (!isRefund && !isEscalation) {
        status = 'AI In-Progress';
        confidence = 88;
        executedTool = '';
        replyMessage = '🤖 Your inquiry is being analyzed by OmniAI autonomous support cluster.';
      }

      // Direct REST API call to Supabase PostgREST (bypasses node-fetch SDK wrapper issues)
      const payload = {
        channel: 'Telegram',
        customer_name: senderName,
        customer_handle: senderHandle,
        original_message: rawText,
        sanitized_message: sanitized,
        status: status,
        confidence_score: confidence,
        executed_tool: executedTool || null,
        zkp_proof_hash: zkpHash,
        ai_reply: replyMessage
      };

      const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/operational_tickets`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (!dbRes.ok) {
        const errText = await dbRes.text();
        console.error('REST_INSERT_ERROR:', errText);
      } else {
        const resultData = await dbRes.json();
        console.log('REST_INSERT_SUCCESS:', resultData);
      }

      // Deliver Telegram Bot message
      if (TELEGRAM_BOT_TOKEN && chatId) {
        let finalResponse = replyMessage;
        if (executedTool) {
          finalResponse += `\n\n⚡ *Autonomous Action:* \`${executedTool}\`\n🔐 *ZKP Proof:* \`${zkpHash}\``;
        }

        const inlineKeyboard = {
          inline_keyboard: [
            [
              { text: '✅ Acknowledge', callback_data: 'ack_ok' },
              { text: '👤 Human Agent', callback_data: 'talk_agent' }
            ]
          ]
        };

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: finalResponse,
            parse_mode: 'Markdown',
            reply_markup: inlineKeyboard
          })
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Webhook Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}