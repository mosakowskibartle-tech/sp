import db from './_db.js';

export async function getTg() {
  try {
    const { data } = await db.from('settings').select('key,value').in('key', ['telegram_bot_token','telegram_chat_id']);
    const s = {};
    (data || []).forEach(r => { s[r.key] = r.value; });
    return {
      token:  s.telegram_bot_token  || process.env.TELEGRAM_BOT_TOKEN  || '',
      chatId: s.telegram_chat_id    || process.env.TELEGRAM_CHAT_ID    || '',
    };
  } catch { return { token: '', chatId: '' }; }
}

export async function sendTg(text) {
  const { token, chatId } = await getTg();
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
  } catch (e) { console.error('TG send error:', e.message); }
}
