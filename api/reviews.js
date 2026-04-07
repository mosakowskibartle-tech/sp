import db from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { all } = req.query;
      const sql = all === 'true'
        ? 'SELECT * FROM reviews ORDER BY created_at DESC'
        : 'SELECT * FROM reviews WHERE approved = TRUE ORDER BY created_at DESC';
      return res.json(await db.query(sql));
    }
    if (req.method === 'POST') {
      const { author_name, rating, text } = req.body;
      const row = await db.one(
        'INSERT INTO reviews (author_name,rating,text,approved) VALUES ($1,$2,$3,FALSE) RETURNING *',
        [author_name, rating, text]
      );
      return res.status(201).json(row);
    }
    if (req.method === 'PUT') {
      const { id, approved } = req.body;
      const row = await db.one(
        'UPDATE reviews SET approved=$2 WHERE id=$1 RETURNING *', [id, approved]
      );
      return res.json(row);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await db.query('DELETE FROM reviews WHERE id=$1', [id]);
      return res.json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[reviews]', err.message);
    res.status(500).json({ error: err.message });
  }
}
