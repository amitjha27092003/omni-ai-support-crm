import { NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

export async function POST(req: Request) {
  try {
    const update = await req.json();

    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const customerText = update.message.text;
      
      const firstName = update.message.from?.first_name || '';
      const lastName = update.message.from?.last_name || '';
      const senderName = (firstName + ' ' + lastName).trim() || 'Telegram User';
      const senderHandle = update.message.from?.username ? '@' + update.message.from.username : 'tg_' + chatId;

      // Direct Live Production Domain
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://omniai-live-support.vercel.app';
      
      const inboundRes = await fetch(`${baseUrl}/api/v1/inbound`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'Telegram',
          customer_name: senderName,
          customer_handle: senderHandle,
          message: customerText
        })
      });

      const inboundData = await inboundRes.json();

      if (TELEGRAM_BOT_TOKEN && chatId) {
        let replyText = inboundData.ai_dispatch || 'Issue registered. Support team is reviewing.';
        
        if (inboundData.executed_tool) {
          replyText += `\n\n⚡ Action: ${inboundData.executed_tool.tool}\n🔖 Ref: ${inboundData.executed_tool.ref}`;
        }

        const inlineKeyboard = {
          inline_keyboard: [
            [
              { text: '✅ Confirm Resolution', callback_data: 'confirm_ok' },
              { text: '👤 Talk to Human', callback_data: 'escalate_human' }
            ]
          ]
        };

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: replyText,
            reply_markup: inlineKeyboard
          })
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Telegram Webhook Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}