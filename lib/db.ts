import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import pg, { type PoolClient, type QueryResultRow } from 'pg';

// Return timestamps as ISO strings so they pass cleanly to client components.
pg.types.setTypeParser(1184, (v) => new Date(v).toISOString()); // timestamptz
pg.types.setTypeParser(1114, (v) => new Date(v + 'Z').toISOString()); // timestamp
pg.types.setTypeParser(20, (v) => Number(v)); // bigint → number (counts / ids are small)

/** Env var names Vercel / Neon may use for the connection string, in order of preference. */
export const DB_ENV_NAMES = ['DATABASE_URL', 'POSTGRES_URL', 'DATABASE_URL_UNPOOLED', 'POSTGRES_URL_NON_POOLING'] as const;

export function connectionString() {
  for (const name of DB_ENV_NAMES) if (process.env[name]) return process.env[name]!;
  return null;
}

const g = globalThis as unknown as { __pgPool?: pg.Pool; __dbReady?: Promise<void> };

function getPool() {
  if (!g.__pgPool) {
    const cs = connectionString();
    if (!cs) throw new Error('No database configured: set DATABASE_URL in Vercel → Settings → Environment Variables');
    g.__pgPool = new pg.Pool({ connectionString: cs, max: 5, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 10_000 });
  }
  return g.__pgPool;
}

/**
 * First request this server instance handles: (re)apply db/schema.sql — it's
 * written to be safe to run every time, and carries any one-time migrations —
 * then load db/seed.sql only if test_cases is still empty (so redeploys don't
 * keep re-seeding over real data). An advisory lock stops two instances racing.
 */
async function setupIfEmpty() {
  const client = await getPool().connect();
  try {
    await client.query('select pg_advisory_lock(727001)');
    try {
      const dir = join(process.cwd(), 'db');
      await client.query(await readFile(join(dir, 'schema.sql'), 'utf8'));
      const has = await client.query<{ ok: boolean }>(`select exists(select 1 from test_cases) as ok`);
      if (!has.rows[0].ok) {
        await client.query(await readFile(join(dir, 'seed.sql'), 'utf8'));
        console.log('[db] Loaded test cases into an empty database');
      }
    } finally {
      await client.query('select pg_advisory_unlock(727001)');
    }
  } finally {
    client.release();
  }
}

export function ensureDb(): Promise<void> {
  if (!g.__dbReady) {
    g.__dbReady = setupIfEmpty().catch((e) => {
      g.__dbReady = undefined; // retry on the next request
      throw e;
    });
  }
  return g.__dbReady;
}

/** Run a parameterised query and return the rows. Always use $1, $2… placeholders. */
export async function q<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  await ensureDb();
  const res = await getPool().query<T>(text, params);
  return res.rows;
}

export async function q1<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await q<T>(text, params);
  return rows[0] ?? null;
}

/** Run several statements in one transaction. */
export async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  await ensureDb();
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const out = await fn(client);
    await client.query('commit');
    return out;
  } catch (e) {
    await client.query('rollback');
    throw e;
  } finally {
    client.release();
  }
}

export const USER_COLS = 'id, full_name, role, created_at';
