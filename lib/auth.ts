import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { q1, USER_COLS } from '@/lib/db';
import { IDENTITY_COOKIE } from '@/lib/session';
import type { Profile } from '@/lib/types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The person this browser picked a name for, or null if it hasn't yet. */
export async function getCurrentUser(): Promise<Profile | null> {
  const id = cookies().get(IDENTITY_COOKIE)?.value;
  if (!id || !UUID.test(id)) return null;
  return q1<Profile>(`select ${USER_COLS} from users where id = $1`, [id]);
}

/** Pages under app/(app) only render once a name has been picked — the layout enforces that. */
export async function requireMember(): Promise<{ profile: Profile }> {
  const profile = await getCurrentUser();
  if (!profile) redirect('/');
  return { profile };
}

export async function requireManager(): Promise<{ profile: Profile }> {
  const ctx = await requireMember();
  if (!isManagerRole(ctx.profile.role)) redirect('/tests');
  return ctx;
}

export const isManagerRole = (role: string) => role === 'admin' || role === 'lead';
