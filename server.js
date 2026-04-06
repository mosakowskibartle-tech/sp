/**
 * server.js — Express + PostgreSQL для Railway
 * npm run build  →  node server.js
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// ── PostgreSQL ─────────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') || process.env.DATABASE_URL?.includes('neon')
    ? { rejectUnauthorized: false }
    : false,
});

pool.query('SELECT 1')
  .then(() => console.log('✅ PostgreSQL подключён'))
  .catch(e => console.error('❌ PostgreSQL ошибка:', e.message));

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// ── Helpers ────────────────────────────────────────────────────────────────────
async function q(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

async function q1(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows[0] ?? null;
}

async function getTelegram() {
  try {
    const rows = await q("SELECT key, value FROM settings WHERE key IN ('telegram_bot_token','telegram_chat_id')");
    const s = {};
    rows.forEach(r => { s[r.key] = r.value; });
    return {
      token:  s.telegram_bot_token  || process.env.TELEGRAM_BOT_TOKEN  || '',
      chatId: s.telegram_chat_id    || process.env.TELEGRAM_CHAT_ID    || '',
    };
  } catch { return { token: '', chatId: '' }; }
}

async function sendTelegram(text) {
  try {
    const { token, chatId } = await getTelegram();
    if (!token || !chatId) return;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (e) { console.error('Telegram error:', e.message); }
}

function wrap(fn) {
  return async (req, res) => {
    try { await fn(req, res); }
    catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  };
}

// ── Health ─────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// ══════════════════════════════════════════════════════════════════════════════
// MENU
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/menu', wrap(async (req, res) => {
  const { category, bar } = req.query;
  let sql = 'SELECT * FROM menu_items WHERE is_active = true';
  const params = [];
  if (category) { params.push(category); sql += ` AND category = $${params.length}`; }
  if (bar === 'true')  { sql += ' AND is_bar = true'; }
  if (bar === 'false') { sql += ' AND is_bar = false'; }
  sql += ' ORDER BY sort_order ASC, id ASC';
  res.json(await q(sql, params));
}));

app.get('/api/menu/all', wrap(async (req, res) => {
  res.json(await q('SELECT * FROM menu_items ORDER BY sort_order ASC, id ASC'));
}));

app.post('/api/menu', wrap(async (req, res) => {
  const { name, description, price, category, image_url, calories, cook_time,
          is_gluten_free, is_lactose_free, is_bar, is_active, is_special,
          original_price, sort_order } = req.body;
  const row = await q1(
    `INSERT INTO menu_items (name,description,price,category,image_url,calories,cook_time,
      is_gluten_free,is_lactose_free,is_bar,is_active,is_special,original_price,sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [name, description, price, category, image_url, calories ?? null, cook_time ?? null,
     is_gluten_free ?? false, is_lactose_free ?? false, is_bar ?? false,
     is_active ?? true, is_special ?? false, original_price ?? null, sort_order ?? 0]
  );
  res.status(201).json(row);
}));

app.put('/api/menu', wrap(async (req, res) => {
  const { id, ...f } = req.body;
  const keys = Object.keys(f);
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const vals = keys.map(k => f[k]);
  const row = await q1(`UPDATE menu_items SET ${sets} WHERE id = $1 RETURNING *`, [id, ...vals]);
  res.json(row);
}));

app.delete('/api/menu', wrap(async (req, res) => {
  await q('DELETE FROM menu_items WHERE id = $1', [req.body.id]);
  res.json({ ok: true });
}));

// ══════════════════════════════════════════════════════════════════════════════
// ORDERS
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/orders', wrap(async (req, res) => {
  res.json(await q('SELECT * FROM orders ORDER BY created_at DESC'));
}));

app.post('/api/orders', wrap(async (req, res) => {
  const { customer_name, customer_phone, delivery_address, comment, items, total_amount } = req.body;
  const row = await q1(
    `INSERT INTO orders (customer_name,customer_phone,delivery_address,comment,items,total_amount,status)
     VALUES ($1,$2,$3,$4,$5,$6,'new') RETURNING *`,
    [customer_name, customer_phone, delivery_address || '', comment || '',
     JSON.stringify(items), total_amount]
  );
  const list = items.map(i => `• ${i.name} ×${i.quantity} = ${i.price * i.quantity}₽`).join('\n');
  await sendTelegram(`🍽 Новый заказ #${row.id}\n\n👤 ${customer_name}\n📞 ${customer_phone}\n📍 ${delivery_address || 'Самовывоз'}\n\n${list}\n\n💰 Итого: ${total_amount}₽\n💬 ${comment || 'Без комментария'}`);
  res.status(201).json(row);
}));

app.put('/api/orders', wrap(async (req, res) => {
  const { id, status } = req.body;
  res.json(await q1('UPDATE orders SET status=$2 WHERE id=$1 RETURNING *', [id, status]));
}));

app.delete('/api/orders', wrap(async (req, res) => {
  await q('DELETE FROM orders WHERE id = $1', [req.body.id]);
  res.json({ ok: true });
}));

// ══════════════════════════════════════════════════════════════════════════════
// RESERVATIONS
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/reservations', wrap(async (req, res) => {
  const { date } = req.query;
  if (date) {
    res.json(await q('SELECT * FROM reservations WHERE date=$1 ORDER BY time ASC', [date]));
  } else {
    res.json(await q('SELECT * FROM reservations ORDER BY created_at DESC'));
  }
}));

app.post('/api/reservations', wrap(async (req, res) => {
  const { guest_name, guest_phone, date, time, guests_count, table_number } = req.body;
  const row = await q1(
    `INSERT INTO reservations (guest_name,guest_phone,date,time,guests_count,table_number,status)
     VALUES ($1,$2,$3,$4,$5,$6,'pending') RETURNING *`,
    [guest_name, guest_phone, date, time, guests_count || 2, table_number || null]
  );
  await sendTelegram(`📅 Новая бронь стола\n\n👤 ${guest_name}\n📞 ${guest_phone}\n🗓 ${date} в ${time}\n👥 Гостей: ${guests_count}\n🪑 Стол: ${table_number || 'любой'}`);
  res.status(201).json(row);
}));

app.put('/api/reservations', wrap(async (req, res) => {
  const { id, status } = req.body;
  res.json(await q1('UPDATE reservations SET status=$2 WHERE id=$1 RETURNING *', [id, status]));
}));

app.delete('/api/reservations', wrap(async (req, res) => {
  await q('DELETE FROM reservations WHERE id = $1', [req.body.id]);
  res.json({ ok: true });
}));

// ══════════════════════════════════════════════════════════════════════════════
// REVIEWS
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/reviews', wrap(async (req, res) => {
  const { all } = req.query;
  if (all === 'true') {
    res.json(await q('SELECT * FROM reviews ORDER BY created_at DESC'));
  } else {
    res.json(await q('SELECT * FROM reviews WHERE approved=true ORDER BY created_at DESC'));
  }
}));

app.post('/api/reviews', wrap(async (req, res) => {
  const { author_name, rating, text } = req.body;
  const row = await q1(
    'INSERT INTO reviews (author_name,rating,text,approved) VALUES ($1,$2,$3,false) RETURNING *',
    [author_name, rating, text]
  );
  res.status(201).json(row);
}));

app.put('/api/reviews', wrap(async (req, res) => {
  const { id, approved } = req.body;
  res.json(await q1('UPDATE reviews SET approved=$2 WHERE id=$1 RETURNING *', [id, approved]));
}));

app.delete('/api/reviews', wrap(async (req, res) => {
  await q('DELETE FROM reviews WHERE id = $1', [req.body.id]);
  res.json({ ok: true });
}));

// ══════════════════════════════════════════════════════════════════════════════
// BANQUETS
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/banquets', wrap(async (req, res) => {
  res.json(await q('SELECT * FROM banquet_requests ORDER BY created_at DESC'));
}));

app.post('/api/banquets', wrap(async (req, res) => {
  const { contact_name, contact_phone, event_type, package_name,
          guests_count, event_date, extra_services, estimated_total, comment } = req.body;
  const row = await q1(
    `INSERT INTO banquet_requests
       (contact_name,contact_phone,event_type,package_name,guests_count,event_date,extra_services,estimated_total,comment,status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'new') RETURNING *`,
    [contact_name, contact_phone, event_type || '', package_name || '',
     guests_count || 0, event_date || '', JSON.stringify(extra_services || []),
     estimated_total || 0, comment || '']
  );
  const svcs = Array.isArray(extra_services) ? extra_services.join(', ') : '—';
  await sendTelegram(`🎉 Заявка на банкет\n\n👤 ${contact_name}\n📞 ${contact_phone}\n🎊 ${event_type}\n📦 Пакет: ${package_name || '—'}\n👥 ${guests_count} чел.\n📅 ${event_date}\n💰 ~${estimated_total}₽\n🎁 ${svcs}\n💬 ${comment || '—'}`);
  res.status(201).json(row);
}));

app.put('/api/banquets', wrap(async (req, res) => {
  const { id, status } = req.body;
  res.json(await q1('UPDATE banquet_requests SET status=$2 WHERE id=$1 RETURNING *', [id, status]));
}));

app.delete('/api/banquets', wrap(async (req, res) => {
  await q('DELETE FROM banquet_requests WHERE id = $1', [req.body.id]);
  res.json({ ok: true });
}));

// ══════════════════════════════════════════════════════════════════════════════
// PROMOTIONS
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/promotions', wrap(async (req, res) => {
  const { all } = req.query;
  if (all === 'true') {
    res.json(await q('SELECT * FROM promotions ORDER BY sort_order ASC, id ASC'));
  } else {
    res.json(await q('SELECT * FROM promotions WHERE is_active=true ORDER BY sort_order ASC'));
  }
}));

app.post('/api/promotions', wrap(async (req, res) => {
  const { title, description, discount_text, expires_at, is_active, sort_order } = req.body;
  const row = await q1(
    `INSERT INTO promotions (title,description,discount_text,expires_at,is_active,sort_order)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [title, description || '', discount_text || '', expires_at || null, is_active ?? true, sort_order ?? 0]
  );
  res.status(201).json(row);
}));

app.put('/api/promotions', wrap(async (req, res) => {
  const { id, ...f } = req.body;
  const keys = Object.keys(f);
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const row = await q1(`UPDATE promotions SET ${sets} WHERE id=$1 RETURNING *`, [id, ...keys.map(k => f[k])]);
  res.json(row);
}));

app.delete('/api/promotions', wrap(async (req, res) => {
  await q('DELETE FROM promotions WHERE id = $1', [req.body.id]);
  res.json({ ok: true });
}));

// ══════════════════════════════════════════════════════════════════════════════
// GALLERY
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/gallery', wrap(async (req, res) => {
  const { all } = req.query;
  if (all === 'true') {
    res.json(await q('SELECT * FROM gallery ORDER BY sort_order ASC, id ASC'));
  } else {
    res.json(await q('SELECT * FROM gallery WHERE is_active=true ORDER BY sort_order ASC'));
  }
}));

app.post('/api/gallery', wrap(async (req, res) => {
  const { url, caption, category, sort_order, is_active } = req.body;
  const row = await q1(
    'INSERT INTO gallery (url,caption,category,sort_order,is_active) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [url, caption || '', category || 'general', sort_order ?? 0, is_active ?? true]
  );
  res.status(201).json(row);
}));

app.put('/api/gallery', wrap(async (req, res) => {
  const { id, ...f } = req.body;
  const keys = Object.keys(f);
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const row = await q1(`UPDATE gallery SET ${sets} WHERE id=$1 RETURNING *`, [id, ...keys.map(k => f[k])]);
  res.json(row);
}));

app.delete('/api/gallery', wrap(async (req, res) => {
  await q('DELETE FROM gallery WHERE id = $1', [req.body.id]);
  res.json({ ok: true });
}));

// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/settings', wrap(async (req, res) => {
  const rows = await q('SELECT key, value FROM settings');
  const obj = {};
  rows.forEach(r => { obj[r.key] = r.value; });
  res.json(obj);
}));

app.put('/api/settings', wrap(async (req, res) => {
  const updates = req.body;
  for (const [key, value] of Object.entries(updates)) {
    await q(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, value]
    );
  }
  res.json({ ok: true });
}));

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN AUTH
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/admin-auth', wrap(async (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin2025';
  if (password === adminPassword) {
    return res.json({ ok: true, token: Buffer.from(`admin:${Date.now()}`).toString('base64') });
  }
  res.status(401).json({ error: 'Неверный пароль' });
}));

// ══════════════════════════════════════════════════════════════════════════════
// MIGRATE — создаёт таблицы если их нет (вызывается один раз при деплое)
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/migrate', wrap(async (req, res) => {
  const secret = req.headers['x-migrate-secret'];
  if (secret !== (process.env.MIGRATE_SECRET || 'migrate2025')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await runMigrations();
  res.json({ ok: true, message: 'Миграция выполнена!' });
}));

async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id            SERIAL PRIMARY KEY,
      name          TEXT NOT NULL,
      description   TEXT,
      price         INTEGER NOT NULL,
      category      TEXT NOT NULL,
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
      items            JSONB NOT NULL,
      total_amount     INTEGER NOT NULL,
      status           TEXT DEFAULT 'new',
      created_at       TIMESTAMPTZ DEFAULT NOW()
    );

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

    CREATE TABLE IF NOT EXISTS reviews (
      id          SERIAL PRIMARY KEY,
      author_name TEXT NOT NULL,
      rating      INTEGER NOT NULL,
      text        TEXT NOT NULL,
      approved    BOOLEAN DEFAULT false,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );

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

    CREATE TABLE IF NOT EXISTS promotions (
      id            SERIAL PRIMARY KEY,
      title         TEXT NOT NULL,
      description   TEXT,
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

    CREATE TABLE IF NOT EXISTS settings (
      id         SERIAL PRIMARY KEY,
      key        TEXT NOT NULL UNIQUE,
      value      TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Default settings
  const defaults = [
    ['telegram_bot_token', ''],
    ['telegram_chat_id', ''],
    ['site_phone', '+7 (925) 767-77-78'],
    ['site_address', 'Московская обл., Химки, ул. Некрасова 15'],
    ['admin_password', 'admin2025'],
  ];
  for (const [key, value] of defaults) {
    await pool.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
      [key, value]
    );
  }
  console.log('✅ Миграция выполнена');
}

// Auto-migrate on startup
runMigrations().catch(e => console.error('Migration error:', e.message));

// ── SPA fallback ───────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Сервер: http://0.0.0.0:${PORT}`);
});
