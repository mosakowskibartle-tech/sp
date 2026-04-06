import db from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { category, bar } = req.query;
      let q = db.from('menu_items').select('*');
      if (bar === 'true')  q = q.eq('is_bar', true);
      if (bar === 'false') q = q.eq('is_bar', false);
      if (category)        q = q.eq('category', category);
      q = q.eq('is_active', true).order('sort_order', { ascending: true });
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'POST') {
      const { data, error } = await db.from('menu_items').insert(req.body).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      const { data, error } = await db.from('menu_items').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await db.from('menu_items').delete().eq('id', id);
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('menu error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
