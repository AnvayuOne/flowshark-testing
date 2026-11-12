import 'server-only';
import pg, { type PoolClient, type QueryResultRow } from 'pg';

// Return timestamps as ISO strings so they pass cleanly to client components.
pg.types.setTypeParser(1184, (v) => new Date(v).toISOString()); // timestamptz
pg.types.setTypeParser(1114, (v) => new Date(v + 'Z').toISOString()); // timestamp
pg.types.setTypeParser(20, (v) => Number(v)); // bigint → number (counts / ids are small)

const g = globalThis as unknown as { __pgPool?: pg.Pool };

function getPool() {
  if (!g.__pgPool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) throw new Error('DATABASE_URL is not set');
    g.__pgPool = new pg.Pool({ connectionString, max: 5, idleTimeoutMillis: 10_000 });
  }
  return g.__pgPool;
}

/** Run a parameterised query and return the rows. Always use $1, $2… placeholders. */
export async function q<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await getPool().query<T>(text, params);
  return res.rows;
}

export async function q1<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await q<T>(text, params);
  return rows[0] ?? null;
}

/** Run several statements in one transaction. */
export async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
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

/** Columns that are safe to send to the browser (never the password hash). */
export const USER_COLS = 'id, email, full_name, role, created_at';
