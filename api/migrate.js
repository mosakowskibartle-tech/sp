/**
 * migrate.js — creates all tables on first deploy.
 * Call once: GET /api/migrate
 */
import db from './_db.js';

const SQL = `
CREATE TABLE IF NOT EXISTS menu_items (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  price         INTEGER NOT NULL DEFAULT 0,
  category      TEXT NOT NULL DEFAULT '',
  image_url     TEXT,
  calories      INTEGER,
  cook_time     INTEGER,
  is_gluten_free BOOLEAN DEFAULT FALSE,
  is_lactose_free BOOLEAN DEFAULT FALSE,
  is_bar        BOOLEAN DEFAULT FALSE,
  is_active     BOOLEAN DEFAULT TRUE,
  is_special    BOOLEAN DEFAULT FALSE,
  original_price INTEGER,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id               SERIAL PRIMARY KEY,
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,
  delivery_address TEXT,
  comment          TEXT,
  items            JSONB NOT NULL DEFAULT '[]',
  total_amount     INTEGER NOT NULL DEFAULT 0,
  status           TEXT DEFAULT 'new',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
  id            SERIAL PRIMARY KEY,
  guest_name    TEXT NOT NULL,
  guest_phone   TEXT NOT NULL,
  date          TEXT NOT NULL,
  time          TEXT NOT NULL,
  guests_count  INTEGER DEFAULT 2,
  table_number  INTEGER,
  status        TEXT DEFAULT 'pending',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id           SERIAL PRIMARY KEY,
  author_name  TEXT NOT NULL,
  rating       INTEGER NOT NULL,
  text         TEXT NOT NULL,
  approved     BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS banquet_requests (
  id               SERIAL PRIMARY KEY,
  contact_name     TEXT NOT NULL,
  contact_phone    TEXT NOT NULL,
  event_type       TEXT,
  package_name     TEXT,
  guests_count     INTEGER,
  event_date       TEXT,
  extra_services   JSONB,
  estimated_total  INTEGER,
  comment          TEXT,
  status           TEXT DEFAULT 'new',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id         SERIAL PRIMARY KEY,
  key        TEXT NOT NULL UNIQUE,
  value      TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO settings (key, value) VALUES
  ('telegram_bot_token', ''),
  ('telegram_chat_id',   ''),
  ('site_phone',         '+7 (925) 767-77-78'),
  ('site_address',       'Московская обл., Химки, ул. Некрасова 15')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS promotions (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT,
  image_url     TEXT,
  discount_text TEXT,
  expires_at    TIMESTAMPTZ,
  is_active     BOOLEAN DEFAULT TRUE,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery (
  id         SERIAL PRIMARY KEY,
  url        TEXT NOT NULL,
  caption    TEXT,
  category   TEXT DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    await db.query(SQL);
    return res.status(200).json({ ok: true, message: 'All tables created / already exist.' });
  } catch (err) {
    console.error('[migrate]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
