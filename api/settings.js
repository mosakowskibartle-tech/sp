import db from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const rows = await db.query('SELECT key, value FROM settings');
      const obj = Object.fromEntries(rows.map(r => [r.key, r.value]));
      return res.json(obj);
    }
    if (req.method === 'PUT') {
      const updates = req.body; // { key: value, ... }
      for (const [key, value] of Object.entries(updates)) {
        await db.query(
          `INSERT INTO settings (key, value, updated_at) VALUES ($1,$2,NOW())
           ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=NOW()`,
          [key, value]
        );
      }
      return res.json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[settings]', err.message);
    res.status(500).json({ error: err.message });
  }
}
