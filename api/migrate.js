/**
 * POST /api/migrate
 * Creates all tables in Neon PostgreSQL.
 * Call once after setting DATABASE_URL.
 * Protected by ADMIN_PASSWORD.
 */
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { password } = req.body || {};
  const adminPass = process.env.ADMIN_PASSWORD || 'admin2025';
  if (password !== adminPass) return res.status(401).json({ error: 'Unauthorized' });

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return res.status(500).json({ error: 'DATABASE_URL not set' });

  const sql = neon(dbUrl);
  const results = [];

  const tables = [
    `CREATE TABLE IF NOT EXISTS menu_items (
      id           SERIAL PRIMARY KEY,
      name         TEXT NOT NULL,
      description  TEXT,
      price        INTEGER NOT NULL,
      category     TEXT NOT NULL,
      image_url    TEXT,
      calories     INTEGER,
      cook_time    INTEGER,
      is_gluten_free  BOOLEAN DEFAULT false,
      is_lactose_free BOOLEAN DEFAULT false,
      is_bar       BOOLEAN DEFAULT false,
      is_active    BOOLEAN DEFAULT true,
      is_special   BOOLEAN DEFAULT false,
      original_price INTEGER,
      sort_order   INTEGER DEFAULT 0,
      created_at   TIMESTAMPTZ DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id               SERIAL PRIMARY KEY,
      customer_name    TEXT NOT NULL,
      customer_phone   TEXT NOT NULL,
      delivery_address TEXT,
      comment          TEXT,
      items            JSONB NOT NULL DEFAULT '[]',
      total_amount     INTEGER NOT NULL,
      status           TEXT DEFAULT 'new',
      created_at       TIMESTAMPTZ DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS reservations (
      id            SERIAL PRIMARY KEY,
      guest_name    TEXT NOT NULL,
      guest_phone   TEXT NOT NULL,
      date          TEXT NOT NULL,
      time          TEXT NOT NULL,
      guests_count  INTEGER DEFAULT 2,
      table_number  INTEGER,
      status        TEXT DEFAULT 'pending',
      created_at    TIMESTAMPTZ DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS reviews (
      id           SERIAL PRIMARY KEY,
      author_name  TEXT NOT NULL,
      rating       INTEGER NOT NULL,
      text         TEXT NOT NULL,
      approved     BOOLEAN DEFAULT false,
      created_at   TIMESTAMPTZ DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS banquet_requests (
      id              SERIAL PRIMARY KEY,
      contact_name    TEXT NOT NULL,
      contact_phone   TEXT NOT NULL,
      event_type      TEXT,
      package_name    TEXT,
      guests_count    INTEGER,
      event_date      TEXT,
      extra_services  JSONB,
      estimated_total INTEGER,
      comment         TEXT,
      status          TEXT DEFAULT 'new',
      created_at      TIMESTAMPTZ DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      id         SERIAL PRIMARY KEY,
      key        TEXT NOT NULL UNIQUE,
      value      TEXT,
      updated_at TIMESTAMPTZ DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS promotions (
      id            SERIAL PRIMARY KEY,
      title         TEXT NOT NULL,
      description   TEXT,
      image_url     TEXT,
      discount_text TEXT,
      expires_at    TIMESTAMPTZ,
      is_active     BOOLEAN DEFAULT true,
      sort_order    INTEGER DEFAULT 0,
      created_at    TIMESTAMPTZ DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS gallery (
      id         SERIAL PRIMARY KEY,
      url        TEXT NOT NULL,
      caption    TEXT,
      category   TEXT DEFAULT 'general',
      sort_order INTEGER DEFAULT 0,
      is_active  BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS delivery_zones (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      price      INTEGER NOT NULL DEFAULT 0,
      min_order  INTEGER DEFAULT 0,
      is_active  BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS promocodes (
      id           SERIAL PRIMARY KEY,
      code         TEXT NOT NULL UNIQUE,
      discount_pct INTEGER DEFAULT 0,
      discount_abs INTEGER DEFAULT 0,
      uses_left    INTEGER DEFAULT -1,
      expires_at   TIMESTAMPTZ,
      is_active    BOOLEAN DEFAULT true,
      created_at   TIMESTAMPTZ DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS blacklist (
      id         SERIAL PRIMARY KEY,
      phone      TEXT NOT NULL UNIQUE,
      reason     TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS action_log (
      id         SERIAL PRIMARY KEY,
      action     TEXT NOT NULL,
      entity     TEXT,
      entity_id  INTEGER,
      details    JSONB,
      created_at TIMESTAMPTZ DEFAULT now()
    )`,
  ];

  // Seed default settings
  const seedSettings = [
    `INSERT INTO settings (key, value) VALUES
      ('telegram_bot_token', ''),
      ('telegram_chat_id', ''),
      ('site_phone', '+7 (925) 767-77-78'),
      ('site_address', 'Московская обл., Химки, ул. Некрасова 15'),
      ('admin_password', 'admin2025')
    ON CONFLICT (key) DO NOTHING`,
  ];

  for (const stmt of [...tables, ...seedSettings]) {
    try {
      await sql(stmt);
      const tableName = stmt.match(/TABLE IF NOT EXISTS (\w+)/)?.[1] ||
                        stmt.match(/INTO (\w+)/)?.[1] || 'seed';
      results.push({ ok: true, table: tableName });
    } catch (err) {
      results.push({ ok: false, error: err.message, stmt: stmt.slice(0, 80) });
    }
  }

  const failed = results.filter(r => !r.ok);
  return res.status(failed.length ? 207 : 200).json({
    message: failed.length ? `${failed.length} errors` : 'All tables created ✅',
    results,
  });
}
