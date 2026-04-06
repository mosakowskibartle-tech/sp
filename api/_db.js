/**
 * _db.js — PostgreSQL client for Railway
 * Uses DATABASE_URL env var (Railway PostgreSQL plugin)
 * Provides same API surface as Supabase client so routes work unchanged
 */
import pg from 'pg';
const { Pool } = pg;

let pool = null;

function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set. Add PostgreSQL plugin in Railway.');
    pool = new Pool({
      connectionString: url,
      ssl: url.includes('railway') || url.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
    });
    pool.on('error', (err) => console.error('PG pool error:', err.message));
  }
  return pool;
}

// ── Query builder ─────────────────────────────────────────────────────────────
class QueryBuilder {
  constructor(table) {
    this._table = table;
    this._filters = [];
    this._columns = '*';
    this._orderBy = null;
    this._limit = null;
    this._single = false;
  }

  select(cols = '*') { this._columns = cols; return this; }
  eq(col, val)  { this._filters.push({ col, op: '=',    val }); return this; }
  neq(col, val) { this._filters.push({ col, op: '!=',   val }); return this; }
  gt(col, val)  { this._filters.push({ col, op: '>',    val }); return this; }
  gte(col, val) { this._filters.push({ col, op: '>=',   val }); return this; }
  lt(col, val)  { this._filters.push({ col, op: '<',    val }); return this; }
  lte(col, val) { this._filters.push({ col, op: '<=',   val }); return this; }
  in(col, vals) { this._filters.push({ col, op: 'IN',   val: vals }); return this; }
  like(col, val){ this._filters.push({ col, op: 'LIKE', val }); return this; }
  ilike(col, val){ this._filters.push({ col, op: 'ILIKE', val }); return this; }
  order(col, { ascending = true } = {}) { this._orderBy = `"${col}" ${ascending ? 'ASC' : 'DESC'}`; return this; }
  limit(n) { this._limit = n; return this; }
  single() { this._single = true; return this; }

  _buildWhere(startIdx = 1) {
    if (!this._filters.length) return { clause: '', params: [], nextIdx: startIdx };
    const parts = [];
    const params = [];
    let idx = startIdx;
    for (const f of this._filters) {
      if (f.op === 'IN') {
        const placeholders = f.val.map(() => `$${idx++}`).join(', ');
        parts.push(`"${f.col}" IN (${placeholders})`);
        params.push(...f.val);
      } else {
        parts.push(`"${f.col}" ${f.op} $${idx++}`);
        params.push(f.val);
      }
    }
    return { clause: 'WHERE ' + parts.join(' AND '), params, nextIdx: idx };
  }

  async _run() {
    const p = getPool();
    const { clause, params } = this._buildWhere(1);
    const cols = this._columns === '*' ? '*'
      : this._columns.split(',').map(c => c.trim()).map(c => c === '*' ? '*' : `"${c}"`).join(', ');
    let sql = `SELECT ${cols} FROM "${this._table}" ${clause}`;
    if (this._orderBy) sql += ` ORDER BY ${this._orderBy}`;
    if (this._limit)   sql += ` LIMIT ${this._limit}`;
    const res = await p.query(sql, params);
    const data = this._single ? (res.rows[0] || null) : res.rows;
    return { data, error: null };
  }

  then(resolve, reject) { return this._run().then(resolve, reject); }
}

class InsertBuilder {
  constructor(table, rows) {
    this._table = table;
    this._rows = Array.isArray(rows) ? rows : [rows];
    this._single = false;
    this._returning = '*';
  }
  select(cols = '*') { this._returning = cols; return this; }
  single() { this._single = true; return this; }

  async _run() {
    const p = getPool();
    const results = [];
    for (const row of this._rows) {
      const keys = Object.keys(row);
      if (!keys.length) continue;
      const cols = keys.map(k => `"${k}"`).join(', ');
      const vals = keys.map((_, i) => `$${i + 1}`).join(', ');
      const params = keys.map(k => row[k]);
      const sql = `INSERT INTO "${this._table}" (${cols}) VALUES (${vals}) RETURNING ${this._returning === '*' ? '*' : this._returning.split(',').map(c => `"${c.trim()}"`).join(', ')}`;
      const res = await p.query(sql, params);
      results.push(res.rows[0]);
    }
    const data = this._single ? (results[0] || null) : results;
    return { data, error: null };
  }

  then(resolve, reject) { return this._run().then(resolve, reject); }
}

class UpdateBuilder {
  constructor(table, updates) {
    this._table = table;
    this._updates = updates;
    this._filters = [];
    this._single = false;
    this._returning = '*';
  }
  eq(col, val) { this._filters.push({ col, op: '=', val }); return this; }
  select(cols = '*') { this._returning = cols; return this; }
  single() { this._single = true; return this; }

  async _run() {
    const p = getPool();
    const keys = Object.keys(this._updates);
    let idx = 1;
    const sets = keys.map(k => `"${k}" = $${idx++}`).join(', ');
    const setParams = keys.map(k => this._updates[k]);
    const whereParts = this._filters.map(f => `"${f.col}" ${f.op} $${idx++}`);
    const whereParams = this._filters.map(f => f.val);
    const clause = whereParts.length ? 'WHERE ' + whereParts.join(' AND ') : '';
    const ret = this._returning === '*' ? '*' : this._returning.split(',').map(c => `"${c.trim()}"`).join(', ');
    const sql = `UPDATE "${this._table}" SET ${sets} ${clause} RETURNING ${ret}`;
    const res = await p.query(sql, [...setParams, ...whereParams]);
    const data = this._single ? (res.rows[0] || null) : res.rows;
    return { data, error: null };
  }

  then(resolve, reject) { return this._run().then(resolve, reject); }
}

class DeleteBuilder {
  constructor(table) {
    this._table = table;
    this._filters = [];
  }
  eq(col, val) { this._filters.push({ col, op: '=', val }); return this; }

  async _run() {
    const p = getPool();
    let idx = 1;
    const whereParts = this._filters.map(f => `"${f.col}" ${f.op} $${idx++}`);
    const params = this._filters.map(f => f.val);
    const clause = whereParts.length ? 'WHERE ' + whereParts.join(' AND ') : '';
    await p.query(`DELETE FROM "${this._table}" ${clause}`, params);
    return { data: null, error: null };
  }

  then(resolve, reject) { return this._run().then(resolve, reject); }
}

class UpsertBuilder {
  constructor(table, rows, opts = {}) {
    this._table = table;
    this._rows = Array.isArray(rows) ? rows : [rows];
    this._conflict = opts.onConflict || 'id';
  }
  select() { return this; }
  single() { return this; }

  async _run() {
    const p = getPool();
    for (const row of this._rows) {
      const keys = Object.keys(row);
      const cols = keys.map(k => `"${k}"`).join(', ');
      const vals = keys.map((_, i) => `$${i + 1}`).join(', ');
      const params = keys.map(k => row[k]);
      const updates = keys.filter(k => k !== this._conflict).map(k => `"${k}" = EXCLUDED."${k}"`).join(', ');
      const sql = `INSERT INTO "${this._table}" (${cols}) VALUES (${vals})
        ON CONFLICT ("${this._conflict}") DO UPDATE SET ${updates}, "updated_at" = NOW()`;
      await p.query(sql, params);
    }
    return { data: null, error: null };
  }

  then(resolve, reject) { return this._run().then(resolve, reject); }
}

// ── Main db object ────────────────────────────────────────────────────────────
const db = {
  from(table) {
    return {
      select: (cols) => new QueryBuilder(table).select(cols),
      insert: (rows) => new InsertBuilder(table, rows),
      update: (data) => new UpdateBuilder(table, data),
      delete: ()     => new DeleteBuilder(table),
      upsert: (rows, opts) => new UpsertBuilder(table, rows, opts),
    };
  },
  // Raw query for migrations
  async query(sql, params = []) {
    return getPool().query(sql, params);
  }
};

export default db;
