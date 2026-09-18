import { NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

export async function POST(req: Request) {
  try {
    const update = await req.json();

    // Agar text message aaya ho
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const customerText = update.message.text;
      const senderName = `${update.message.from.first_name \vert{}\vert{} ''}${update.message.from.last_name || ''}`.trim() || 'Telegram User';
      const senderHandle = update.message.from.username ? `@${update.message.from.username}` : `tg_${chatId}`;

      // Call our internal universal router
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
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

      // Telegram par customer ko instant auto-reply bhejo
      if (TELEGRAM_BOT_TOKEN && chatId) {
        let replyText = inboundData.ai_dispatch || 'Aapka issue register ho gaya hai. Support team review kar rahi hai.';
        
        // Agar tool execute hua ho, to confirmation details add karo
        if (inboundData.executed_tool) {
          replyText += `\n\n⚡ *Autonomous Action Executed:* ${inboundData.executed_tool.tool}\n🔖 *Ref:* \`${inboundData.executed_tool.ref}\``;
        }

        // Inline Interactive Keyboard Buttons
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
            parse_mode: 'Markdown',
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