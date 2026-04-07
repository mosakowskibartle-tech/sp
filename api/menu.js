import db from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    /* GET /api/menu?bar=false&category=Шашлык */
    if (req.method === 'GET') {
      const { bar, category } = req.query;
      let sql = 'SELECT * FROM menu_items WHERE is_active = TRUE';
      const params = [];
      if (bar === 'true')  { params.push(true);  sql += ` AND is_bar = $${params.length}`; }
      if (bar === 'false') { params.push(false); sql += ` AND is_bar = $${params.length}`; }
      if (category)        { params.push(category); sql += ` AND category = $${params.length}`; }
      sql += ' ORDER BY sort_order ASC, id ASC';
      const rows = await db.query(sql, params);
      return res.json(rows);
    }

    /* GET all (admin) */
    if (req.method === 'GET' && req.query.all === 'true') {
      const rows = await db.query('SELECT * FROM menu_items ORDER BY sort_order ASC, id ASC');
      return res.json(rows);
    }

    /* POST — create */
    if (req.method === 'POST') {
      const { name, description='', price=0, category='', image_url='', calories=null,
              cook_time=null, is_gluten_free=false, is_lactose_free=false,
              is_bar=false, is_active=true, is_special=false,
              original_price=null, sort_order=0 } = req.body;
      const row = await db.one(
        `INSERT INTO menu_items
         (name,description,price,category,image_url,calories,cook_time,
          is_gluten_free,is_lactose_free,is_bar,is_active,is_special,original_price,sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING *`,
        [name,description,price,category,image_url,calories,cook_time,
         is_gluten_free,is_lactose_free,is_bar,is_active,is_special,original_price,sort_order]
      );
      return res.status(201).json(row);
    }

    /* PUT — update */
    if (req.method === 'PUT') {
      const { id, ...fields } = req.body;
      const keys = Object.keys(fields);
      if (!keys.length) return res.status(400).json({ error: 'No fields to update' });
      const set = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
      const row = await db.one(
        `UPDATE menu_items SET ${set} WHERE id = $1 RETURNING *`,
        [id, ...Object.values(fields)]
      );
      return res.json(row);
    }

    /* DELETE */
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await db.query('DELETE FROM menu_items WHERE id = $1', [id]);
      return res.json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[menu]', err.message);
    res.status(500).json({ error: err.message });
  }
}
