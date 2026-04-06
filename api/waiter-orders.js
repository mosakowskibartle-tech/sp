import db from './_db.js';
import { sendTg } from './_tg.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    // PIN check for waiter
    const pin = req.headers['x-waiter-pin'] || req.query.pin;
    const { data: settings } = await db.from('settings').select('key,value').in('key', ['waiter_pin']);
    const expectedPin = settings?.find(s => s.key === 'waiter_pin')?.value || '1234';
    if (pin !== expectedPin) return res.status(401).json({ error: 'Неверный PIN' });

    if (req.method === 'GET') {
      const { table } = req.query;
      let q = db.from('orders').select('*').order('created_at', { ascending: false });
      if (table) q = q.eq('table_number', parseInt(table));
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const order = { ...req.body, status: 'new' };
      const { data, error } = await db.from('orders').insert(order).select().single();
      if (error) throw error;
      const items = (order.items || []).map(i => `• ${i.name} ×${i.quantity}`).join('\n');
      await sendTg(`🍽 <b>Заказ от официанта</b>\nСтол #${order.table_number}\n\n${items}\n\n💰 ${order.total_amount}₽${order.waiter_note ? `\n📝 ${order.waiter_note}` : ''}`);
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, status } = req.body;
      const { data, error } = await db.from('orders').update({ status }).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
