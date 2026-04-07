import db from './_db.js';
import { sendTelegram } from './_tg.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { date } = req.query;
      let sql = 'SELECT * FROM reservations';
      const params = [];
      if (date) { params.push(date); sql += ' WHERE date = $1'; }
      sql += ' ORDER BY created_at DESC';
      const rows = await db.query(sql, params);
      return res.json(rows);
    }

    if (req.method === 'POST') {
      const { guest_name, guest_phone, date, time,
              guests_count=2, table_number=null, status='pending' } = req.body;
      const row = await db.one(
        `INSERT INTO reservations (guest_name,guest_phone,date,time,guests_count,table_number,status)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [guest_name, guest_phone, date, time, guests_count, table_number, status]
      );
      await sendTelegram(
        `📅 <b>Новая бронь стола</b>\n\n` +
        `👤 ${guest_name}\n📞 ${guest_phone}\n` +
        `🗓 ${date} в ${time}\n👥 Гостей: ${guests_count}\n` +
        `🪑 Стол: ${table_number ?? 'любой'}`
      );
      return res.status(201).json(row);
    }

    if (req.method === 'PUT') {
      const { id, status } = req.body;
      const row = await db.one(
        'UPDATE reservations SET status=$2 WHERE id=$1 RETURNING *', [id, status]
      );
      return res.json(row);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      await db.query('DELETE FROM reservations WHERE id=$1', [id]);
      return res.json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[reservations]', err.message);
    res.status(500).json({ error: err.message });
  }
}
