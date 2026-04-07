import db from './_db.js';

export async function sendTelegram(text) {
  try {
    const rows = await db.query(
      "SELECT key, value FROM settings WHERE key IN ('telegram_bot_token','telegram_chat_id')"
    );
    const s = Object.fromEntries(rows.map(r => [r.key, r.value]));
    const token = s.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN || '';
    const chatId = s.telegram_chat_id || process.env.TELEGRAM_CHAT_ID || '';
    if (!token || !chatId) return;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
  } catch (e) {
    console.error('[TG]', e.message);
  }
}
