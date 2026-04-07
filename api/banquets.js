import db from './_db.js';
import { sendTelegram } from './_tg.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      return res.json(await db.query('SELECT * FROM banquet_requests ORDER BY created_at DESC'));
    }
    if (req.method === 'POST') {
      const { contact_name, contact_phone, event_type='', package_name='',
              guests_count=0, event_date='', extra_services=[], estimated_total=0,
              comment='', status='new' } = req.body;
      const row = await db.one(
        `INSERT INTO banquet_requests
         (contact_name,contact_phone,event_type,package_name,guests_count,event_date,extra_services,estimated_total,comment,status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [contact_name, contact_phone, event_type, package_name, guests_count,
         event_date, JSON.stringify(extra_services), estimated_total, comment, status]
      );
      const svcs = Array.isArray(extra_services) ? extra_services.join(', ') : '—';
      await sendTelegram(
        `🎉 <b>Заявка на банкет</b>\n\n` +
        `👤 ${contact_name}\n📞 ${contact_phone}\n` +
        `🎊 Повод: ${event_type}\n📦 Пакет: ${package_name || '—'}\n` +
        `👥 Гостей: ${guests_count}\n📅 Дата: ${event_date}\n` +
        `💰 ~${estimated_total}₽\n🎁 Доп: ${svcs}\n💬 ${comment || 'Без комментария'}`
      );
      return res.status(201).json(row);
    }
    if (req.method === 'PUT') {
      const { id, status } = req.body;
      const row = await db.one(
        'UPDATE banquet_requests SET status=$2 WHERE id=$1 RETURNING *', [id, status]
      );
      return res.json(row);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[banquets]', err.message);
    res.status(500).json({ error: err.message });
  }
}
