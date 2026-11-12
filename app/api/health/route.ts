import { NextResponse } from 'next/server';
import { DB_ENV_NAMES, connectionString, ensureDb, q1 } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Setup check: says what is configured and whether the database works. Never returns secret values.
export async function GET() {
  const cs = connectionString();
  const report: Record<string, unknown> = {
    database_env_var: DB_ENV_NAMES.find((n) => process.env[n]) ?? 'MISSING — add DATABASE_URL in Vercel → Settings → Environment Variables, then redeploy',
    database_host: cs ? safeHost(cs) : null,
    AUTH_SECRET: process.env.AUTH_SECRET ? (process.env.AUTH_SECRET.length >= 32 ? 'set' : 'TOO SHORT (needs 32+ characters)') : 'missing',
    APP_URL: process.env.APP_URL ?? 'missing',
    SMTP_HOST: process.env.SMTP_HOST ? 'set' : 'missing',
  };

  if (cs) {
    try {
      await ensureDb();
      const r = await q1<{ modules: number; test_cases: number; users: number }>(
        'select (select count(*) from modules)::int modules, (select count(*) from test_cases)::int test_cases, (select count(*) from users)::int users',
      );
      report.database = 'connected';
      report.counts = r;
    } catch (e) {
      report.database = 'ERROR';
      report.database_error = (e as Error).message;
    }
  }

  const ok = report.database === 'connected';
  return NextResponse.json({ ok, ...report }, { status: ok ? 200 : 500, headers: { 'Cache-Control': 'no-store' } });
}

function safeHost(cs: string) {
  try {
    return new URL(cs).hostname;
  } catch {
    return 'unparseable connection string';
  }
}
