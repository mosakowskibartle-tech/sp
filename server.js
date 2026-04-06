/**
 * server.js — Express server for Railway
 * Serves the React SPA (dist/) AND all /api/* routes from api/ directory
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Dynamic import helper for ESM api handlers
async function loadHandler(name) {
  const mod = await import(`./api/${name}.js`);
  return mod.default;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── API routes ────────────────────────────────────────────────────────────────
const API_ROUTES = [
  'menu', 'orders', 'reservations', 'reviews', 'banquets',
  'settings', 'promotions', 'gallery', 'admin-auth',
  'promocodes', 'delivery-zones', 'waiter-orders'
];

for (const route of API_ROUTES) {
  app.all(`/api/${route}`, async (req, res) => {
    try {
      const handler = await loadHandler(route);
      await handler(req, res);
    } catch (e) {
      console.error(`[${route}]`, e.message);
      if (!res.headersSent) res.status(500).json({ error: e.message });
    }
  });
}

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// Order status (public)
app.all('/api/order-status', async (req, res) => {
  try {
    const h = await loadHandler('order-status');
    await h(req, res);
  } catch (e) {
    if (!res.headersSent) res.status(500).json({ error: e.message });
  }
});

// ── Static SPA ────────────────────────────────────────────────────────────────
const distDir = path.join(__dirname, 'dist');
app.use(express.static(distDir));
app.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
