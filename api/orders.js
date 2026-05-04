import db from './_db.js';
import { sendTelegram } from './_tg.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    // --- 1. GET: Получить заказы ---
    if (req.method === 'GET') {
      // Если есть параметр table, ищем заказ для конкретного стола (для QR меню)
      if (req.query.table) {
        const tableNum = parseInt(req.query.table);
        
        // Ищем последний активный заказ для этого СТОЛА (по новой колонке table_number)
        const rows = await db.query(
          `SELECT * FROM orders 
           WHERE table_number = $1 
           AND status NOT IN ('delivered', 'cancelled')
           ORDER BY created_at DESC 
           LIMIT 1`,
          [tableNum]
        );

        if (rows.length === 0) {
          return res.json({
            waiterName: "Не назначен",
            items: [],
            total: 0,
            message: "Нет активных заказов"
          });
        }

        const order = rows[0];
        return res.json({
          waiterName: order.waiter_name || "Официант",
          items: order.items,
          total: order.total_amount,
          status: order.status
        });
      }

      // Обычный GET: вернуть все заказы (для админки/кухни)
      const rows = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
      return res.json(rows);
    }

    // --- 2. POST: Создать новый заказ ---
    if (req.method === 'POST') {
      const { 
        customer_name, 
        customer_phone, 
        delivery_address = '', 
        comment = '',
        items = [], 
        total_amount = 0, 
        status = 'new',
        table_number = null,   // <--- Номер стола (если есть)
        waiter_name = null     // <--- Имя официанта (если есть)
      } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Корзина пуста' });
      }

      // Вставляем заказ с новыми полями
      const row = await db.one(
        `INSERT INTO orders 
         (customer_name, customer_phone, delivery_address, comment, items, total_amount, status, table_number, waiter_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         RETURNING *`,
        [
          customer_name, 
          customer_phone, 
          delivery_address, 
          comment,
          JSON.stringify(items), 
          total_amount, 
          status,
          table_number,
          waiter_name
        ]
      );

      // Уведомление в Telegram (только если это не тестовый заказ)
      if (process.env.TELEGRAM_BOT_TOKEN) {
          const lines = items.map(i => `• ${i.name} ×${i.quantity} = ${i.price * i.quantity}₽`).join('\n');
          const tableInfo = table_number ? `\n📍 Стол: <b>${table_number}</b>` : '';
          const waiterInfo = waiter_name ? `\n👨‍🍳 Официант: <b>${waiter_name}</b>` : '';

          await sendTelegram(
            `🍽 <b>Новый заказ #${row.id}</b>\n\n` +
            `👤 ${customer_name}\n📞 ${customer_phone}\n` +
            `${tableInfo}${waiterInfo}\n\n` +
            `${lines}\n\n` +
            `💰 Итого: <b>${total_amount}₽</b>\n💬 ${comment || 'Без комментария'}`
          );
      }

      return res.status(201).json(row);
    }

    // --- 3. PUT: Обновить статус заказа ---
    if (req.method === 'PUT') {
      const { id, status } = req.body;
      if (!id || !status) {
        return res.status(400).json({ error: 'Missing id or status' });
      }
      
      const row = await db.one(
        'UPDATE orders SET status=$2 WHERE id=$1 RETURNING *', 
        [id, status]
      );
      return res.json(row);
    }

    res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('[orders]', err.message);
    res.status(500).json({ error: err.message });
  }
}