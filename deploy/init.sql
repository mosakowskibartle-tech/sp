-- ═══════════════════════════════════════════════════════════
-- Кафе «Соль и Перец» — инициализация базы данных
-- Запуск: psql -U sol_perec_user -d sol_perec -f init.sql
-- ═══════════════════════════════════════════════════════════

-- Создание пользователя и БД (выполнять от postgres)
-- CREATE USER sol_perec_user WITH PASSWORD 'ВАШ_ПАРОЛЬ';
-- CREATE DATABASE sol_perec OWNER sol_perec_user;
-- GRANT ALL PRIVILEGES ON DATABASE sol_perec TO sol_perec_user;

-- ── Настройки ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id         SERIAL PRIMARY KEY,
  key        TEXT UNIQUE NOT NULL,
  value      TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO settings (key, value) VALUES
  ('telegram_bot_token', ''),
  ('telegram_chat_id',   ''),
  ('site_phone',         '+7 (925) 767-77-78'),
  ('site_address',       'Московская обл., Химки, ул. Некрасова 15')
ON CONFLICT (key) DO NOTHING;

-- ── Меню ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT,
  price           INTEGER NOT NULL,
  category        TEXT NOT NULL,
  image_url       TEXT,
  calories        INTEGER,
  cook_time       INTEGER,
  is_gluten_free  BOOLEAN DEFAULT FALSE,
  is_lactose_free BOOLEAN DEFAULT FALSE,
  is_bar          BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  is_special      BOOLEAN DEFAULT FALSE,
  original_price  INTEGER,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Заказы ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               SERIAL PRIMARY KEY,
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,
  delivery_address TEXT,
  comment          TEXT,
  items            JSONB NOT NULL,
  total_amount     INTEGER NOT NULL,
  status           TEXT DEFAULT 'new',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Бронирования ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservations (
  id           SERIAL PRIMARY KEY,
  guest_name   TEXT NOT NULL,
  guest_phone  TEXT NOT NULL,
  date         TEXT NOT NULL,
  time         TEXT NOT NULL,
  guests_count INTEGER DEFAULT 2,
  table_number INTEGER,
  status       TEXT DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Отзывы ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          SERIAL PRIMARY KEY,
  author_name TEXT NOT NULL,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text        TEXT NOT NULL,
  approved    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Банкеты ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banquet_requests (
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
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Акции ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promotions (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT,
  discount_text TEXT,
  expires_at    TIMESTAMPTZ,
  is_active     BOOLEAN DEFAULT TRUE,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Галерея ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gallery (
  id         SERIAL PRIMARY KEY,
  url        TEXT NOT NULL,
  caption    TEXT,
  category   TEXT DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_menu_category    ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_active      ON menu_items(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_status    ON orders(status);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(approved);

SELECT 'База данных инициализирована успешно!' AS result;
