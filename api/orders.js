import db from './_db.js';
import { sendTelegram } from './_tg.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const rows = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
      return res.json(rows);
    }

    if (req.method === 'POST') {
      const { customer_name, customer_phone, delivery_address='', comment='',
              items=[], total_amount=0, status='new' } = req.body;
      const row = await db.one(
        `INSERT INTO orders (customer_name,customer_phone,delivery_address,comment,items,total_amount,status)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [customer_name, customer_phone, delivery_address, comment,
         JSON.stringify(items), total_amount, status]
      );
      const lines = items.map(i => `• ${i.name} ×${i.quantity} = ${i.price * i.quantity}₽`).join('\n');
      await sendTelegram(
        `🍽 <b>Новый заказ #${row.id}</b>\n\n` +
        `👤 ${customer_name}\n📞 ${customer_phone}\n` +
        `📍 ${delivery_address || 'Самовывоз'}\n\n${lines}\n\n` +
        `💰 Итого: <b>${total_amount}₽</b>\n💬 ${comment || 'Без комментария'}`
      );
      return res.status(201).json(row);
    }

    if (req.method === 'PUT') {
      const { id, status } = req.body;
      const row = await db.one(
        'UPDATE orders SET status=$2 WHERE id=$1 RETURNING *', [id, status]
      );
      return res.json(row);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[orders]', err.message);
    res.status(500).json({ error: err.message });
  }
}
