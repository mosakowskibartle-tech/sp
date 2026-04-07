/**
 * _db.js — Native PostgreSQL pool for Railway
 * Reads DATABASE_URL (Railway injects this automatically).
 * Fallback: individual PG_* vars.
 */
import pg from 'pg';
const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.RAILWAY_DATABASE_URL ||
  '';

if (!connectionString) {
  console.error('[DB] ❌  Missing DATABASE_URL. Add a PostgreSQL service in Railway and link it.');
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('railway') || connectionString.includes('amazonaws')
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => console.error('[DB] pool error', err.message));

/** Simple query helper: db.query(sql, params?) → rows[] */
const db = {
  async query(sql, params = []) {
    const client = await pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  },
  async one(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0] ?? null;
  },
  pool,
};

export default db;
