import db from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const rows = await db.query("SELECT * FROM orders WHERE status NOT IN ('delivered','cancelled') ORDER BY created_at DESC");
    return res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
