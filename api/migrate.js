/**
 * migrate.js — Creates ALL tables + seeds default data
 * Run once after deploy: GET https://your-app.railway.app/api/migrate?secret=YOUR_MIGRATE_SECRET
 */
import db from './_db.js';

// ─── Full schema ──────────────────────────────────────────────────────────────
const TABLES = `

CREATE TABLE IF NOT EXISTS menu_items (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  price         INTEGER NOT NULL DEFAULT 0,
  category      TEXT NOT NULL DEFAULT '',
  image_url     TEXT,
  calories      INTEGER,
  cook_time     INTEGER,
  is_gluten_free  BOOLEAN DEFAULT false,
  is_lactose_free BOOLEAN DEFAULT false,
  is_bar        BOOLEAN DEFAULT false,
  is_active     BOOLEAN DEFAULT true,
  is_special    BOOLEAN DEFAULT false,
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
  zone_name        TEXT,
  delivery_cost    INTEGER DEFAULT 0,
  promo_code       TEXT,
  discount_amount  INTEGER DEFAULT 0,
  table_number     INTEGER,
  waiter_note      TEXT,
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
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text         TEXT NOT NULL,
  approved     BOOLEAN DEFAULT false,
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

CREATE TABLE IF NOT EXISTS promotions (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT,
  image_url     TEXT,
  discount_text TEXT,
  expires_at    TIMESTAMPTZ,
  is_active     BOOLEAN DEFAULT true,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery (
  id         SERIAL PRIMARY KEY,
  url        TEXT NOT NULL,
  caption    TEXT,
  category   TEXT DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promocodes (
  id             SERIAL PRIMARY KEY,
  code           TEXT NOT NULL UNIQUE,
  discount_type  TEXT NOT NULL DEFAULT 'percent',
  discount_value INTEGER NOT NULL DEFAULT 0,
  min_order      INTEGER DEFAULT 0,
  max_uses       INTEGER,
  used_count     INTEGER DEFAULT 0,
  expires_at     TIMESTAMPTZ,
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_zones (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  min_order     INTEGER DEFAULT 0,
  delivery_cost INTEGER DEFAULT 0,
  delivery_time TEXT,
  is_active     BOOLEAN DEFAULT true,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
`;

// ─── Default settings ─────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = [
  { key: 'telegram_bot_token',  value: '' },
  { key: 'telegram_chat_id',    value: '' },
  { key: 'site_phone',          value: '+7 (925) 767-77-78' },
  { key: 'site_address',        value: 'Московская обл., Химки, ул. Некрасова 15' },
  { key: 'waiter_pin',          value: '1234' },
  { key: 'admin_password',      value: 'admin2025' },
  { key: 'delivery_enabled',    value: 'true' },
  { key: 'min_order_amount',    value: '500' },
];

const DEFAULT_ZONES = [
  { name: 'Сходня (бесплатно)', description: 'Посёлок Сходня, ул. Некрасова и ближайшие улицы', min_order: 500,  delivery_cost: 0,   delivery_time: '30–45 мин', sort_order: 1, is_active: true },
  { name: 'Химки',              description: 'г. Химки, центр и ближайшие районы',               min_order: 1000, delivery_cost: 150, delivery_time: '45–60 мин', sort_order: 2, is_active: true },
  { name: 'Зеленоград',         description: 'г. Зеленоград',                                    min_order: 1500, delivery_cost: 250, delivery_time: '60–90 мин', sort_order: 3, is_active: true },
];

const DEFAULT_PROMOS = [
  { title: 'Счастливые часы',        description: 'С 12:00 до 16:00 скидка 20% на горячие блюда и супы', discount_text: '-20%', expires_at: '2025-12-31T23:59:59Z', is_active: true, sort_order: 1 },
  { title: 'Шашлык-пати в выходные', description: 'По пятницам и субботам — шашлык ассорти микс за 3500₽ вместо 4500₽', discount_text: '-1000₽', expires_at: '2025-12-31T23:59:59Z', is_active: true, sort_order: 2 },
  { title: 'Бизнес-ланч',           description: 'Суп + горячее + напиток всего за 490₽. Ежедневно с 12:00 до 15:00', discount_text: '490₽', expires_at: '2025-12-31T23:59:59Z', is_active: true, sort_order: 3 },
];

const DEFAULT_CODES = [
  { code: 'SCHODNYA10', discount_type: 'percent', discount_value: 10, min_order: 500,  is_active: true },
  { code: 'WELCOME15',  discount_type: 'percent', discount_value: 15, min_order: 1000, max_uses: 100, is_active: true },
  { code: 'FLAT200',    discount_type: 'fixed',   discount_value: 200, min_order: 800, is_active: true },
];

const DEFAULT_GALLERY = [
  { url: '/images/gallery-1.jpg', caption: 'Уютный зал кафе',         category: 'interior', sort_order: 1 },
  { url: '/images/gallery-2.jpg', caption: 'Шашлык на мангале',        category: 'food',     sort_order: 2 },
  { url: '/images/gallery-3.jpg', caption: 'День рождения в нашем зале', category: 'events', sort_order: 3 },
  { url: '/images/gallery-4.jpg', caption: 'Шах-плов',                 category: 'food',     sort_order: 4 },
  { url: '/images/gallery-5.jpg', caption: 'Наш бар',                  category: 'bar',      sort_order: 5 },
  { url: '/images/gallery-6.jpg', caption: 'Банкетный зал',            category: 'events',   sort_order: 6 },
  { url: '/images/interior.jpg',  caption: 'Интерьер ресторана',        category: 'interior', sort_order: 7 },
  { url: '/images/banquet.jpg',   caption: 'Банкет',                   category: 'events',   sort_order: 8 },
];

const DEFAULT_REVIEWS = [
  { author_name: 'Александр К.',  rating: 5, text: 'Отличное кафе! Шашлык просто невероятный, порции большие, обслуживание быстрое. Будем приходить ещё!', approved: true },
  { author_name: 'Марина С.',     rating: 5, text: 'Посещаем регулярно всей семьёй. Детям очень нравится плов, муж не может наесться на шашлык. Атмосфера уютная, рекомендуем!', approved: true },
  { author_name: 'Дмитрий В.',    rating: 5, text: 'Отмечали день рождения здесь. Организация на высоте — всё было вовремя, еда вкусная, музыка отличная. Большое спасибо команде!', approved: true },
  { author_name: 'Ольга П.',      rating: 4, text: 'Хорошее место, вкусная еда. Единственное что ждали чуть дольше обычного, но зато всё принесли горячим и вкусным. Будем возвращаться.', approved: true },
  { author_name: 'Игорь Н.',      rating: 5, text: 'Самое вкусное место в Сходне! Шашлык из баранины — просто шедевр. Цены адекватные, персонал дружелюбный.', approved: true },
];

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const secret = req.query.secret || req.body?.secret;
  const expected = process.env.MIGRATE_SECRET || 'migrate2025';
  if (secret !== expected) {
    return res.status(403).json({ error: 'Forbidden. Pass ?secret=YOUR_MIGRATE_SECRET' });
  }

  const results = [];
  const errors = [];

  try {
    // 1. Create all tables
    await db.query(TABLES);
    results.push('✅ All tables created');

    // 2. Seed settings (skip if exists)
    for (const s of DEFAULT_SETTINGS) {
      await db.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
        [s.key, s.value]
      );
    }
    results.push('✅ Settings seeded');

    // 3. Seed delivery zones
    const { data: zones } = await db.from('delivery_zones').select('id');
    if (!zones?.length) {
      for (const z of DEFAULT_ZONES) {
        const keys = Object.keys(z);
        const cols = keys.map(k => `"${k}"`).join(', ');
        const vals = keys.map((_, i) => `$${i+1}`).join(', ');
        await db.query(`INSERT INTO delivery_zones (${cols}) VALUES (${vals})`, keys.map(k => z[k]));
      }
      results.push('✅ Delivery zones seeded');
    } else {
      results.push('⏭️ Delivery zones already exist, skipped');
    }

    // 4. Seed promotions
    const { data: promos } = await db.from('promotions').select('id');
    if (!promos?.length) {
      for (const p of DEFAULT_PROMOS) {
        const keys = Object.keys(p);
        const cols = keys.map(k => `"${k}"`).join(', ');
        const vals = keys.map((_, i) => `$${i+1}`).join(', ');
        await db.query(`INSERT INTO promotions (${cols}) VALUES (${vals})`, keys.map(k => p[k]));
      }
      results.push('✅ Promotions seeded');
    } else {
      results.push('⏭️ Promotions already exist, skipped');
    }

    // 5. Seed promo codes
    for (const c of DEFAULT_CODES) {
      await db.query(
        `INSERT INTO promocodes (code, discount_type, discount_value, min_order, max_uses, used_count, is_active)
         VALUES ($1,$2,$3,$4,$5,0,$6) ON CONFLICT (code) DO NOTHING`,
        [c.code, c.discount_type, c.discount_value, c.min_order, c.max_uses || null, c.is_active]
      );
    }
    results.push('✅ Promo codes seeded');

    // 6. Seed gallery
    const { data: gal } = await db.from('gallery').select('id');
    if (!gal?.length) {
      for (const g of DEFAULT_GALLERY) {
        const keys = Object.keys(g);
        const cols = keys.map(k => `"${k}"`).join(', ');
        const vals = keys.map((_, i) => `$${i+1}`).join(', ');
        await db.query(`INSERT INTO gallery (${cols}) VALUES (${vals})`, keys.map(k => g[k]));
      }
      results.push('✅ Gallery seeded');
    } else {
      results.push('⏭️ Gallery already exists, skipped');
    }

    // 7. Seed reviews
    const { data: revs } = await db.from('reviews').select('id');
    if (!revs?.length) {
      for (const r of DEFAULT_REVIEWS) {
        await db.query(
          `INSERT INTO reviews (author_name, rating, text, approved) VALUES ($1,$2,$3,$4)`,
          [r.author_name, r.rating, r.text, r.approved]
        );
      }
      results.push('✅ Reviews seeded');
    } else {
      results.push('⏭️ Reviews already exist, skipped');
    }

    return res.status(200).json({
      ok: true,
      message: '🚀 Migration complete! Your database is ready.',
      results,
      errors,
      tables: [
        'menu_items', 'orders', 'reservations', 'reviews',
        'banquet_requests', 'settings', 'promotions', 'gallery',
        'promocodes', 'delivery_zones'
      ],
      next_steps: [
        '1. Open /admin and log in (password: admin2025)',
        '2. Go to Settings and configure Telegram notifications',
        '3. Add menu items via Menu tab in admin',
        '4. Test an order to verify Telegram works',
      ]
    });

  } catch (err) {
    console.error('Migration error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message,
      results,
      hint: 'Make sure DATABASE_URL is set correctly in Railway environment variables'
    });
  }
}
