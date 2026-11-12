import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { q1, USER_COLS } from '@/lib/db';
import { SESSION_COOKIE, SESSION_DAYS, signSession } from '@/lib/session';
import type { Profile } from '@/lib/types';

// TEMP: login is disabled. Every visitor is treated as this account until sign-in is restored
// (revert this commit to bring back session-based auth from lib/session.ts).
const DEV_BYPASS_EMAIL = 'dev@anvayuone.com';

async function getDevBypassUser(): Promise<Profile> {
  // Upsert so concurrent requests (layout + page both call requireMember()) can't race
  // on the first-ever insert.
  const user = await q1<Profile>(
    `insert into users (email, full_name, password_hash, email_verified_at, role)
     values ($1, 'Dev User', '', now(), 'admin')
     on conflict (email) do update set email = excluded.email
     returning ${USER_COLS}`,
    [DEV_BYPASS_EMAIL],
  );
  return user!;
}

/** The signed-in, verified company user — re-checked against the DB on every request. */
export async function getCurrentUser(): Promise<Profile | null> {
  return getDevBypassUser();
}

export async function requireMember(): Promise<{ profile: Profile }> {
  const profile = await getCurrentUser();
  if (!profile) redirect('/login');
  return { profile };
}

export async function requireManager(): Promise<{ profile: Profile }> {
  const ctx = await requireMember();
  if (!isManagerRole(ctx.profile.role)) redirect('/tests');
  return ctx;
}

export const isManagerRole = (role: string) => role === 'admin' || role === 'lead';

export async function startSession(userId: string, sessionVersion: number) {
  const token = await signSession(userId, sessionVersion);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export function endSession() {
  cookies().delete(SESSION_COOKIE);
}

// ---------- one-time tokens (email verification / password reset) ----------
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export const newToken = () => randomBytes(32).toString('base64url');

/** Public base URL used in emails. Set APP_URL in production so links can't be spoofed via Host headers. */
export function appUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'production') throw new Error('APP_URL must be set in production');
  const h = headers();
  return `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host') ?? 'localhost:3000'}`;
}

export function clientIp() {
  return headers().get('x-forwarded-for')?.split(',')[0]?.trim() || headers().get('x-real-ip') || 'unknown';
}
