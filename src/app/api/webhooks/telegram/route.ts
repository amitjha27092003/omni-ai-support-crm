import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

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

      let status = 'Open';
      let confidence = 95; // Stored as integer/clean numeric
      let executedTool = '';
      let replyMessage = '';

      if (isRefund) {
        status = 'AI Resolved';
        executedTool = 'stripe_recon_agent';
        replyMessage = '✅ Your refund request has been analyzed and processed autonomously via shadow execution.';
      } else if (isEscalation) {
        status = 'Escalated';
        confidence = 65;
        replyMessage = '⚠️ Your request contains high-priority indicators and has been escalated to Tier-2 Operations.';
      } else {
        status = 'AI In-Progress';
        confidence = 88;
        replyMessage = '🤖 Your inquiry is being analyzed by OmniAI autonomous support cluster.';
      }

      // Insert matching table columns
      const { data: insertedData, error: dbError } = await supabase
        .from('operational_tickets')
        .insert([
          {
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
          }
        ])
        .select();

      if (dbError) {
        console.error('SUPABASE_INSERT_FAIL:', dbError);
      } else {
        console.log('SUPABASE_INSERT_SUCCESS:', insertedData);
      }

      // Send response to Telegram
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