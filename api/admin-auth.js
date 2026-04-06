export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'POST') {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin2025';
    if (password === adminPassword) {
      return res.status(200).json({ ok: true, token: Buffer.from(`admin:${Date.now()}`).toString('base64') });
    }
    return res.status(401).json({ error: 'Неверный пароль' });
  }
  res.status(405).json({ error: 'Method not allowed' });
}
