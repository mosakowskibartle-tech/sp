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
        ? 'SELECT * FROM promotions ORDER BY sort_order ASC, id ASC'
        : 'SELECT * FROM promotions WHERE is_active=TRUE ORDER BY sort_order ASC, id ASC';
      return res.json(await db.query(sql));
    }
    if (req.method === 'POST') {
      const { title, description='', image_url='', discount_text='',
              expires_at=null, is_active=true, sort_order=0 } = req.body;
      const row = await db.one(
        `INSERT INTO promotions (title,description,image_url,discount_text,expires_at,is_active,sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [title, description, image_url, discount_text, expires_at, is_active, sort_order]
      );
      return res.status(201).json(row);
    }
    if (req.method === 'PUT') {
      const { id, ...fields } = req.body;
      const keys = Object.keys(fields);
      const set = keys.map((k, i) => `${k}=$${i+2}`).join(',');
      const row = await db.one(
        `UPDATE promotions SET ${set} WHERE id=$1 RETURNING *`,
        [id, ...Object.values(fields)]
      );
      return res.json(row);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await db.query('DELETE FROM promotions WHERE id=$1', [id]);
      return res.json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[promotions]', err.message);
    res.status(500).json({ error: err.message });
  }
}
