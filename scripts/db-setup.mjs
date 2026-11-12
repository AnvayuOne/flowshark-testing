// Creates the tables and loads the test cases into your Vercel Postgres database.
// Usage:  npm run db:setup          (schema + seed)
//         npm run db:setup -- --schema-only
// Reads DATABASE_URL (or POSTGRES_URL) from the environment or .env.local
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Minimal .env.local loader (no extra dependency).
for (const f of ['.env.local', '.env']) {
  const p = join(root, f);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Copy it from Vercel → Storage → your database → .env.local tab.');
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query(readFileSync(join(root, 'db', 'schema.sql'), 'utf8'));
  console.log('✓ Schema applied');
  if (!process.argv.includes('--schema-only')) {
    await client.query(readFileSync(join(root, 'db', 'seed.sql'), 'utf8'));
    const { rows } = await client.query('select (select count(*) from modules)::int m, (select count(*) from test_cases)::int t');
    console.log(`✓ Test cases loaded: ${rows[0].m} modules, ${rows[0].t} test cases`);
  }
} finally {
  await client.end();
}
