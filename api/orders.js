import db from './_db.js';
import { sendTg } from './_tg.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { id, status } = req.query;
      let q = db.from('orders').select('*');
      if (id)     q = q.eq('id', parseInt(id));
      if (status) q = q.eq('status', status);
      q = q.order('created_at', { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(id ? (data?.[0] || null) : (data || []));
    }

    if (req.method === 'POST') {
      const order = req.body;

      // Validate promo code
      if (order.promo_code) {
        const { data: codes } = await db.from('promocodes').select('*').eq('code', order.promo_code.toUpperCase()).eq('is_active', true);
        const code = codes?.[0];
        if (code) {
          // Check usage limit
          if (code.max_uses && code.used_count >= code.max_uses) {
            return res.status(400).json({ error: 'Промокод исчерпан' });
          }
          // Check expiry
          if (code.expires_at && new Date(code.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Промокод истёк' });
          }
          // Check min order
          if (order.total_amount < code.min_order) {
            return res.status(400).json({ error: `Минимальная сумма заказа для этого промокода: ${code.min_order}₽` });
          }
          // Apply discount
          if (code.discount_type === 'percent') {
            order.discount_amount = Math.round(order.total_amount * code.discount_value / 100);
          } else {
            order.discount_amount = code.discount_value;
          }
          order.total_amount = Math.max(0, order.total_amount - order.discount_amount);
          // Increment usage
          await db.from('promocodes').update({ used_count: (code.used_count || 0) + 1 }).eq('id', code.id);
        } else {
          return res.status(400).json({ error: 'Промокод не найден или неактивен' });
        }
      }

      const { data, error } = await db.from('orders').insert(order).select().single();
      if (error) throw error;

      // Build order status URL
      const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : (process.env.SITE_URL || 'http://localhost:3000');
      const statusUrl = `${baseUrl}/order/${data.id}`;

      // Telegram notification
      const items = (order.items || []).map(i => `• ${i.name} ×${i.quantity} = ${i.price * i.quantity}₽`).join('\n');
      const discount = order.discount_amount ? `\n🏷 Скидка: -${order.discount_amount}₽ (${order.promo_code})` : '';
      const msg = `🍽 <b>Новый заказ #${data.id}</b>\n\n👤 ${order.customer_name}\n📞 ${order.customer_phone}\n📍 ${order.delivery_address || 'Самовывоз'}${order.zone_name ? ` (${order.zone_name})` : ''}\n\n${items}${discount}\n\n💰 Итого: <b>${data.total_amount}₽</b>\n💬 ${order.comment || 'Без комментария'}\n\n🔗 <a href="${statusUrl}">Статус заказа</a>`;
      await sendTg(msg);

      return res.status(201).json({ ...data, status_url: statusUrl });
    }

    if (req.method === 'PUT') {
      const { id, status, ...rest } = req.body;
      const updates = { ...rest };
      if (status) updates.status = status;
      const { data, error } = await db.from('orders').update(updates).eq('id', id).select().single();
      if (error) throw error;

      // Notify customer on status change
      if (status && ['confirmed','preparing','delivered','cancelled'].includes(status)) {
        const statusLabels = { confirmed: '✅ Подтверждён', preparing: '👨‍🍳 Готовится', delivered: '🚀 Доставлен', cancelled: '❌ Отменён' };
        const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : (process.env.SITE_URL || '');
        const msg = `📦 <b>Заказ #${id}</b> — статус изменён: ${statusLabels[status]}\n🔗 <a href="${baseUrl}/order/${id}">Отслеживать заказ</a>`;
        await sendTg(msg);
      }

      return res.status(200).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('orders error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
