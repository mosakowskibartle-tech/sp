import db from './_db.js';
import { sendTg } from './_tg.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { date } = req.query;
      let q = db.from('reservations').select('*').order('created_at', { ascending: false });
      if (date) q = q.eq('date', date);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'POST') {
      const r = req.body;
      const { data, error } = await db.from('reservations').insert(r).select().single();
      if (error) throw error;
      await sendTg(`📅 <b>Новая бронь стола</b>\n\n👤 ${r.guest_name}\n📞 ${r.guest_phone}\n🗓 ${r.date} в ${r.time}\n👥 Гостей: ${r.guests_count}\n🪑 Стол: ${r.table_number || 'любой'}`);
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, status } = req.body;
      const { data, error } = await db.from('reservations').update({ status }).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await db.from('reservations').delete().eq('id', id);
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
