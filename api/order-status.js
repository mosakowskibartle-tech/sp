import db from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });
  try {
    const row = await db.one('SELECT id, status, created_at FROM orders WHERE id=$1', [id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    return res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
