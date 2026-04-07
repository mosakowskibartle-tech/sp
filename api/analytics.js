import db from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const [ordersTotal] = await db.query('SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount),0) as revenue FROM orders');
    const [reservationsTotal] = await db.query('SELECT COUNT(*) as cnt FROM reservations');
    const [reviewsTotal] = await db.query('SELECT COUNT(*) as cnt, COALESCE(AVG(rating),0) as avg FROM reviews WHERE approved=TRUE');
    const [banquetsTotal] = await db.query('SELECT COUNT(*) as cnt FROM banquet_requests');
    const recentOrders = await db.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5');
    return res.json({
      orders: { count: parseInt(ordersTotal.cnt), revenue: parseInt(ordersTotal.revenue) },
      reservations: { count: parseInt(reservationsTotal.cnt) },
      reviews: { count: parseInt(reviewsTotal.cnt), avg: parseFloat(reviewsTotal.avg).toFixed(1) },
      banquets: { count: parseInt(banquetsTotal.cnt) },
      recentOrders,
    });
  } catch (err) {
    console.error('[analytics]', err.message);
    res.status(500).json({ error: err.message });
  }
}
