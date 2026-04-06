import db from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });

  try {
    const { data, error } = await db.from('orders').select('id,customer_name,status,items,total_amount,created_at,delivery_address,zone_name,delivery_cost,discount_amount').eq('id', parseInt(id));
    if (error) throw error;
    if (!data?.length) return res.status(404).json({ error: 'Заказ не найден' });
    return res.status(200).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
