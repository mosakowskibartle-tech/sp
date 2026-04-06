import db from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      // Public: validate a code
      const { code } = req.query;
      if (code) {
        const { data } = await db.from('promocodes').select('*').eq('code', code.toUpperCase()).eq('is_active', true);
        const c = data?.[0];
        if (!c) return res.status(404).json({ error: 'Промокод не найден' });
        if (c.expires_at && new Date(c.expires_at) < new Date()) return res.status(400).json({ error: 'Промокод истёк' });
        if (c.max_uses && c.used_count >= c.max_uses) return res.status(400).json({ error: 'Промокод исчерпан' });
        return res.status(200).json({ code: c.code, discount_type: c.discount_type, discount_value: c.discount_value, min_order: c.min_order });
      }
      // Admin: all codes
      const { data, error } = await db.from('promocodes').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'POST') {
      const row = { ...req.body, code: req.body.code?.toUpperCase(), used_count: 0 };
      const { data, error } = await db.from('promocodes').insert(row).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      if (updates.code) updates.code = updates.code.toUpperCase();
      const { data, error } = await db.from('promocodes').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await db.from('promocodes').delete().eq('id', id);
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
