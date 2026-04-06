/**
 * migrate.js — Run once to create all tables in Railway PostgreSQL
 * GET /api/migrate?secret=MIGRATE_SECRET
 */
import db from './_db.js';

const TABLES = `
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  calories INTEGER,
  cook_time INTEGER,
  is_gluten_free BOOLEAN DEFAULT false,
  is_lactose_free BOOLEAN DEFAULT false,
  is_bar BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_special BOOLEAN DEFAULT false,
  original_price INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT,
  comment TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'new',
  zone_name TEXT,
  delivery_cost INTEGER DEFAULT 0,
  promo_code TEXT,
  discount_amount INTEGER DEFAULT 0,
  table_number INTEGER,
  waiter_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  guests_count INTEGER DEFAULT 2,
  table_number INTEGER,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  text TEXT NOT NULL,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS banquet_requests (
  id SERIAL PRIMARY KEY,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  event_type TEXT,
  package_name TEXT,
  guests_count INTEGER,
  event_date TEXT,
  extra_services JSONB,
  estimated_total INTEGER,
  comment TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promotions (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  discount_text TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  caption TEXT,
  category TEXT DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promocodes (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percent',
  discount_value INTEGER NOT NULL DEFAULT 10,
  min_order INTEGER DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_zones (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  min_order INTEGER DEFAULT 0,
  delivery_cost INTEGER DEFAULT 0,
  delivery_time TEXT DEFAULT '30-60 мин',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

const DEFAULT_SETTINGS = [
  { key: 'telegram_bot_token', value: '' },
  { key: 'telegram_chat_id',   value: '' },
  { key: 'site_phone',         value: '+7 (925) 767-77-78' },
  { key: 'site_address',       value: 'Московская обл., Химки, ул. Некрасова 15' },
  { key: 'delivery_enabled',   value: 'true' },
  { key: 'waiter_pin',         value: '1234' },
];

const DEFAULT_ZONES = [
  { name: 'Сходня (бесплатно)', description: 'Посёлок Сходня, ул. Некрасова и ближайшие', min_order: 500,  delivery_cost: 0,   delivery_time: '30-45 мин', sort_order: 1 },
  { name: 'Химки',              description: 'г. Химки в пределах МКАД',                  min_order: 1000, delivery_cost: 150, delivery_time: '45-60 мин', sort_order: 2 },
  { name: 'Зеленоград',         description: 'г. Зеленоград',                              min_order: 1500, delivery_cost: 250, delivery_time: '60-90 мин', sort_order: 3 },
];

const DEFAULT_PROMOS = [
  { title: 'Счастливые часы', description: 'С 12:00 до 16:00 скидка 20% на горячие блюда', discount_text: '-20%', expires_at: '2025-12-31T23:59:59Z', is_active: true, sort_order: 1 },
  { title: 'Шашлык-пати в выходные', description: 'По пятницам и субботам — шашлык ассорти микс за 3500₽', discount_text: '-1000₽', expires_at: '2025-12-31T23:59:59Z', is_active: true, sort_order: 2 },
];

const DEFAULT_CODES = [
  { code: 'SCHODNYA10', discount_type: 'percent', discount_value: 10, min_order: 500,  is_active: true },
  { code: 'WELCOME15',  discount_type: 'percent', discount_value: 15, min_order: 1000, max_uses: 100, is_active: true },
  { code: 'FLAT200',    discount_type: 'fixed',   discount_value: 200, min_order: 800, is_active: true },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const secret = req.query.secret || req.body?.secret;
  const expected = process.env.MIGRATE_SECRET || 'migrate2025';
  if (secret !== expected) return res.status(403).json({ error: 'Forbidden. Pass ?secret=...' });

  try {
    // Create tables
    await db.query(TABLES);

    // Seed settings
    for (const s of DEFAULT_SETTINGS) {
      await db.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
        [s.key, s.value]
      );
    }

    // Seed delivery zones
    const { data: existingZones } = await db.from('delivery_zones').select('id');
    if (!existingZones?.length) {
      for (const z of DEFAULT_ZONES) {
        const keys = Object.keys(z);
        const cols = keys.map(k => `"${k}"`).join(', ');
        const vals = keys.map((_, i) => `$${i+1}`).join(', ');
        await db.query(`INSERT INTO delivery_zones (${cols}) VALUES (${vals})`, keys.map(k => z[k]));
      }
    }

    // Seed promos
    const { data: existingPromos } = await db.from('promotions').select('id');
    if (!existingPromos?.length) {
      for (const p of DEFAULT_PROMOS) {
        const keys = Object.keys(p);
        const cols = keys.map(k => `"${k}"`).join(', ');
        const vals = keys.map((_, i) => `$${i+1}`).join(', ');
        await db.query(`INSERT INTO promotions (${cols}) VALUES (${vals})`, keys.map(k => p[k]));
      }
    }

    // Seed promo codes
    for (const c of DEFAULT_CODES) {
      await db.query(
        `INSERT INTO promocodes (code, discount_type, discount_value, min_order, max_uses, is_active)
         VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (code) DO NOTHING`,
        [c.code, c.discount_type, c.discount_value, c.min_order, c.max_uses || null, c.is_active]
      );
    }

    return res.status(200).json({
      ok: true,
      message: 'Migration complete! All tables created and seeded.',
      tables: ['menu_items','orders','reservations','reviews','banquet_requests','settings','promotions','gallery','promocodes','delivery_zones']
    });
  } catch (err) {
    console.error('Migration error:', err);
    return res.status(500).json({ error: err.message });
  }
}
