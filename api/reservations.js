import supabase from './_supabase.js';

async function getTg() {
  const { data } = await supabase.from('settings').select('key,value').in('key', ['telegram_bot_token','telegram_chat_id']);
  const s = {}; (data||[]).forEach(r => { s[r.key] = r.value; });
  return { token: s.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN, chatId: s.telegram_chat_id || process.env.TELEGRAM_CHAT_ID };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { date } = req.query;
      let q = supabase.from('reservations').select('*').order('created_at', { ascending: false });
      if (date) q = q.eq('date', date);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const body = req.body;
      const { data, error } = await supabase.from('reservations').insert(body).select().single();
      if (error) throw error;
      const { token, chatId } = await getTg();
      if (token && chatId) {
        const msg = `📅 Новая бронь стола\n\n👤 ${body.guest_name}\n📞 ${body.guest_phone}\n🗓 ${body.date} в ${body.time}\n👥 Гостей: ${body.guests_count}\n🪑 Стол: ${body.table_number || 'любой'}`;
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: msg }) }).catch(() => {});
      }
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, status } = req.body;
      const { data, error } = await supabase.from('reservations').update({ status }).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      const { error } = await supabase.from('reservations').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('reservations error:', err);
    res.status(500).json({ error: err.message });
  }
}
