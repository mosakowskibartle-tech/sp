import db from './_db.js';
import { sendTg } from './_tg.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await db.from('banquet_requests').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'POST') {
      const b = req.body;
      const { data, error } = await db.from('banquet_requests').insert(b).select().single();
      if (error) throw error;
      const svcs = Array.isArray(b.extra_services) ? b.extra_services.join(', ') : '—';
      await sendTg(`🎉 <b>Заявка на банкет</b>\n\n👤 ${b.contact_name}\n📞 ${b.contact_phone}\n🎊 Повод: ${b.event_type || '—'}\n📦 Пакет: ${b.package_name || '—'}\n👥 Гостей: ${b.guests_count}\n📅 Дата: ${b.event_date}\n💰 ~${b.estimated_total}₽\n🎁 Услуги: ${svcs}\n💬 ${b.comment || '—'}`);
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, status } = req.body;
      const { data, error } = await db.from('banquet_requests').update({ status }).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
