/**
 * server.js — Express server for Railway deployment
 * Vite React SPA (dist/) + /api/* routes
 *
 * Compatible with Express 5 + path-to-regexp v8
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Dynamic API loader ────────────────────────────────────────────────────────
const handlerCache = new Map();

async function loadHandler(name) {
  if (handlerCache.has(name)) return handlerCache.get(name);
  const mod = await import(`./api/${name}.js`);
  handlerCache.set(name, mod.default);
  return mod.default;
}

function apiRoute(name) {
  return async (req, res) => {
    try {
      const handler = await loadHandler(name);
      await handler(req, res);
    } catch (e) {
      console.error(`[API/${name}]`, e.message);
      if (!res.headersSent) res.status(500).json({ error: e.message });
    }
  };
}

// ── API routes ────────────────────────────────────────────────────────────────
const ROUTES = [
  'menu', 'orders', 'reservations', 'reviews', 'banquets',
  'settings', 'promotions', 'gallery', 'admin-auth',
  'promocodes', 'delivery-zones', 'waiter-orders',
  'order-status', 'analytics', 'action-log', 'blacklist', 'migrate',
];

for (const route of ROUTES) {
  app.all(`/api/${route}`, apiRoute(route));
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    ts: Date.now(),
    env: process.env.NODE_ENV || 'production',
    db: !!process.env.DATABASE_URL ? 'postgresql' : 'missing',
  });
});

// ── Serve React SPA ───────────────────────────────────────────────────────────
const distDir = path.join(__dirname, 'dist');
app.use(express.static(distDir, { maxAge: '1d', etag: true }));

// Express 5 requires '/{*path}' for catch-all (fixes PathError)
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Соль и Перец | port ${PORT} | ${process.env.NODE_ENV || 'production'}`);
  console.log(`   DB:       ${process.env.DATABASE_URL ? '✅ PostgreSQL connected' : '❌ DATABASE_URL missing!'}`);
  console.log(`   Telegram: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ configured' : '⚙️  configure in /admin'}`);
});
