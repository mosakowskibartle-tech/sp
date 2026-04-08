/**
 * server.js — Express server for Railway deployment
 * Serves: Vite React SPA (dist/) + /api/* routes → Railway PostgreSQL
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Dynamic API loader ────────────────────────────────────────────────────────
const cache = new Map();
async function loadHandler(name) {
  if (cache.has(name)) return cache.get(name);
  const mod = await import(`./api/${name}.js`);
  cache.set(name, mod.default);
  return mod.default;
}
function route(name) {
  return async (req, res) => {
    try {
      await (await loadHandler(name))(req, res);
    } catch (e) {
      console.error(`[${name}]`, e.message);
      if (!res.headersSent) res.status(500).json({ error: e.message });
    }
  };
}

// ── API routes ────────────────────────────────────────────────────────────────
const ROUTES = [
  'menu', 'orders', 'reservations', 'reviews', 'banquets',
  'settings', 'promotions', 'gallery', 'admin-auth',
  'analytics', 'action-log', 'blacklist',
  'delivery-zones', 'promocodes', 'waiter-orders',
  'order-status', 'migrate',
];
for (const r of ROUTES) app.all(`/api/${r}`, route(r));

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({
  ok: true,
  ts: Date.now(),
  db: process.env.DATABASE_URL ? '✅ connected' : '❌ DATABASE_URL missing',
}));

// ── React SPA ─────────────────────────────────────────────────────────────────
const dist = path.join(__dirname, 'dist');
app.use(express.static(dist, { maxAge: '1d' }));
app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀  Соль и Перец | http://localhost:${PORT}`);
  console.log(`   DATABASE_URL : ${process.env.DATABASE_URL ? '✅ set' : '❌ MISSING — add PostgreSQL in Railway'}`);
  console.log(`   ADMIN_PWD    : ${process.env.ADMIN_PASSWORD ? '✅ set' : '⚠️  using default admin2025'}`);
  console.log(`   Telegram     : ${process.env.TELEGRAM_BOT_TOKEN ? '✅ set' : '⚙️  configure in /admin → Settings'}\n`);
  if (!process.env.DATABASE_URL) {
    console.warn('  ⚠️  No DATABASE_URL! Run GET /api/migrate after adding PostgreSQL in Railway.\n');
  }
});
