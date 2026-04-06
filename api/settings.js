import db from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await db.from('settings').select('*');
      if (error) throw error;
      const obj = {};
      (data || []).forEach(r => { obj[r.key] = r.value; });
      return res.status(200).json(obj);
    }
    if (req.method === 'PUT') {
      for (const [key, value] of Object.entries(req.body)) {
        await db.from('settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      }
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
