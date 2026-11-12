import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { q1 } from '@/lib/db';
import { SESSION_COOKIE, SESSION_DAYS, readSession, signSession } from '@/lib/session';
import { isCompanyEmail } from '@/lib/constants';
import type { Profile } from '@/lib/types';

/** The signed-in, verified company user — re-checked against the DB on every request. */
export async function getCurrentUser(): Promise<Profile | null> {
  const session = await readSession(cookies().get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await q1<Profile & { session_version: number; email_verified_at: string | null }>(
    'select id, email, full_name, role, created_at, session_version, email_verified_at from users where id = $1',
    [session.userId],
  );
  if (!user || user.session_version !== session.sv || !user.email_verified_at || !isCompanyEmail(user.email)) return null;
  const { session_version: _sv, email_verified_at: _ev, ...profile } = user;
  return profile;
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
