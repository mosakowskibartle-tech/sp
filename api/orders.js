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
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const order = req.body;
      const { data, error } = await supabase.from('orders').insert(order).select().single();
      if (error) throw error;
      const { token, chatId } = await getTg();
      if (token && chatId) {
        const items = (order.items||[]).map(i => `• ${i.name} ×${i.quantity} = ${i.price*i.quantity}₽`).join('\n');
        const msg = `🍽 Новый заказ #${data.id}\n\n👤 ${order.customer_name}\n📞 ${order.customer_phone}\n📍 ${order.delivery_address||'Самовывоз'}\n\n${items}\n\n💰 Итого: ${order.total_amount}₽\n💬 ${order.comment||'Без комментария'}`;
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: msg }) }).catch(() => {});
      }
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, status } = req.body;
      const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('orders error:', err);
    res.status(500).json({ error: err.message });
  }
}
