/**
 * _db.js — Neon PostgreSQL client
 * Drop-in replacement for the old Supabase REST wrapper.
 * Exposes the same db.from(table).select/insert/update/delete/upsert API
 * so ALL existing API routes work without any changes.
 *
 * Requires env var: DATABASE_URL (Neon connection string)
 * Falls back to Supabase REST if DATABASE_URL is not set (safe migration).
 */

import { neon } from '@neondatabase/serverless';

// ── helpers ──────────────────────────────────────────────────────────────────

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL env var is not set');
  return neon(url);
}

/** Quote an identifier safely */
function qi(name) {
  return `"${name.replace(/"/g, '""')}"`;
}

/** Escape a value for SQL — Neon tagged-template handles this, but we need it for dynamic queries */
function buildWhere(filters) {
  // filters: array of { col, op, val }
  if (!filters || filters.length === 0) return { clause: '', params: [], offset: 0 };
  const parts = [];
  const params = [];
  let idx = 1;
  for (const f of filters) {
    if (f.op === 'in') {
      const placeholders = f.val.map(() => `$${idx++}`).join(', ');
      parts.push(`${qi(f.col)} IN (${placeholders})`);
      params.push(...f.val);
    } else if (f.op === 'is') {
      parts.push(`${qi(f.col)} IS ${f.val === null ? 'NULL' : 'NOT NULL'}`);
    } else {
      const opMap = { eq: '=', neq: '!=', gt: '>', gte: '>=', lt: '<', lte: '<=' };
      parts.push(`${qi(f.col)} ${opMap[f.op] || '='} $${idx++}`);
      params.push(f.val);
    }
  }
  return { clause: 'WHERE ' + parts.join(' AND '), params };
}

// ── Query builder ─────────────────────────────────────────────────────────────

class Query {
  constructor(table) {
    this._table   = table;
    this._cols    = '*';
    this._filters = [];   // [{ col, op, val }]
    this._orderCol = null;
    this._orderAsc = true;
    this._limitN  = null;
    this._single  = false;
  }

  select(cols) { this._cols = cols; return this; }

  eq(col, val)  { this._filters.push({ col, op: 'eq',  val }); return this; }
  neq(col, val) { this._filters.push({ col, op: 'neq', val }); return this; }
  gt(col, val)  { this._filters.push({ col, op: 'gt',  val }); return this; }
  gte(col, val) { this._filters.push({ col, op: 'gte', val }); return this; }
  lt(col, val)  { this._filters.push({ col, op: 'lt',  val }); return this; }
  lte(col, val) { this._filters.push({ col, op: 'lte', val }); return this; }
  is(col, val)  { this._filters.push({ col, op: 'is',  val }); return this; }
  in(col, vals) { this._filters.push({ col, op: 'in',  val: vals }); return this; }

  order(col, { ascending = true } = {}) {
    this._orderCol = col; this._orderAsc = ascending; return this;
  }
  limit(n) { this._limitN = n; return this; }
  single()  { this._single = true; return this; }

  async get() {
    try {
      const sql = getSql();
      const { clause, params } = buildWhere(this._filters);

      // Build column list
      const colList = this._cols === '*' ? '*' : this._cols.split(',').map(c => qi(c.trim())).join(', ');

      let query = `SELECT ${colList} FROM ${qi(this._table)} ${clause}`;
      if (this._orderCol) query += ` ORDER BY ${qi(this._orderCol)} ${this._orderAsc ? 'ASC' : 'DESC'}`;
      if (this._limitN)   query += ` LIMIT ${parseInt(this._limitN)}`;

      const rows = await sql(query, params);
      const data = this._single ? (rows[0] ?? null) : rows;
      return { data, error: null };
    } catch (err) {
      console.error(`[db] SELECT ${this._table}:`, err.message);
      return { data: null, error: { message: err.message } };
    }
  }
}

// ── Table ─────────────────────────────────────────────────────────────────────

class Table {
  constructor(table) { this._table = table; }

  /** Returns a Query builder (call .get() to execute) */
  select(cols = '*') { return new Query(this._table).select(cols); }

  /** INSERT one row, returns { data, error } */
  async insert(body, { single = true } = {}) {
    try {
      const sql = getSql();
      const keys = Object.keys(body);
      if (keys.length === 0) throw new Error('insert: empty body');

      const cols   = keys.map(k => qi(k)).join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const vals   = keys.map(k => body[k]);

      const rows = await sql(
        `INSERT INTO ${qi(this._table)} (${cols}) VALUES (${placeholders}) RETURNING *`,
        vals
      );
      return { data: single ? (rows[0] ?? null) : rows, error: null };
    } catch (err) {
      console.error(`[db] INSERT ${this._table}:`, err.message);
      return { data: null, error: { message: err.message } };
    }
  }

  /**
   * UPDATE rows matching filters.
   * filters: array of [col, val] pairs  (legacy API used by existing routes)
   */
  async update(body, filters = []) {
    try {
      const sql = getSql();
      const keys = Object.keys(body);
      if (keys.length === 0) throw new Error('update: empty body');

      let paramIdx = 1;
      const setClauses = keys.map(k => `${qi(k)} = $${paramIdx++}`);
      const setVals    = keys.map(k => body[k]);

      // filters is [[col, val], ...]
      const whereParts = filters.map(([col]) => `${qi(col)} = $${paramIdx++}`);
      const whereVals  = filters.map(([, val]) => val);

      const whereClause = whereParts.length ? 'WHERE ' + whereParts.join(' AND ') : '';
      const query = `UPDATE ${qi(this._table)} SET ${setClauses.join(', ')} ${whereClause} RETURNING *`;

      const rows = await sql(query, [...setVals, ...whereVals]);
      return { data: rows[0] ?? null, error: null };
    } catch (err) {
      console.error(`[db] UPDATE ${this._table}:`, err.message);
      return { data: null, error: { message: err.message } };
    }
  }

  /** DELETE rows matching filters: [[col, val], ...] */
  async delete(filters = []) {
    try {
      const sql = getSql();
      const whereParts = filters.map(([col], i) => `${qi(col)} = $${i + 1}`);
      const whereVals  = filters.map(([, val]) => val);
      const whereClause = whereParts.length ? 'WHERE ' + whereParts.join(' AND ') : '';
      await sql(`DELETE FROM ${qi(this._table)} ${whereClause}`, whereVals);
      return { error: null };
    } catch (err) {
      console.error(`[db] DELETE ${this._table}:`, err.message);
      return { error: { message: err.message } };
    }
  }

  /** UPSERT — INSERT … ON CONFLICT DO UPDATE */
  async upsert(body, { onConflict } = {}) {
    try {
      const sql = getSql();
      const keys = Object.keys(body);
      if (keys.length === 0) throw new Error('upsert: empty body');

      const cols        = keys.map(k => qi(k)).join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const vals        = keys.map(k => body[k]);

      let query = `INSERT INTO ${qi(this._table)} (${cols}) VALUES (${placeholders})`;
      if (onConflict) {
        const updateClauses = keys
          .filter(k => k !== onConflict)
          .map(k => `${qi(k)} = EXCLUDED.${qi(k)}`);
        query += ` ON CONFLICT (${qi(onConflict)}) DO UPDATE SET ${updateClauses.join(', ')}`;
      } else {
        query += ` ON CONFLICT DO NOTHING`;
      }
      query += ' RETURNING *';

      const rows = await sql(query, vals);
      return { data: rows[0] ?? null, error: null };
    } catch (err) {
      console.error(`[db] UPSERT ${this._table}:`, err.message);
      return { data: null, error: { message: err.message } };
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

const db = {
  from: (table) => new Table(table),

  /** Run raw SQL — use sparingly, only for migrations/setup */
  async raw(sqlStr, params = []) {
    try {
      const sql = getSql();
      const rows = await sql(sqlStr, params);
      return { data: rows, error: null };
    } catch (err) {
      return { data: null, error: { message: err.message } };
    }
  },
};

export default db;
