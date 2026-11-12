'use server';

import { cookies } from 'next/headers';
import { q1 } from '@/lib/db';
import { IDENTITY_COOKIE, IDENTITY_DAYS } from '@/lib/session';

/** First time on this device: pick (or reuse) a person by name and remember them in a cookie. */
export async function setIdentity(name: string): Promise<{ ok?: true; error?: string }> {
  const full_name = String(name ?? '').trim().slice(0, 120);
  if (!full_name) return { error: 'Please enter your name.' };

  const existing = await q1<{ id: string }>('select id from users where lower(full_name) = lower($1)', [full_name]);
  let userId: string;
  if (existing) {
    userId = existing.id;
  } else {
    const admins = await q1<{ n: number }>(`select count(*)::int n from users where role = 'admin'`);
    const role = (admins?.n ?? 0) === 0 ? 'admin' : 'tester';
    const created = await q1<{ id: string }>('insert into users (full_name, role) values ($1, $2) returning id', [full_name, role]);
    userId = created!.id;
  }

  cookies().set(IDENTITY_COOKIE, userId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: IDENTITY_DAYS * 24 * 60 * 60,
  });
  return { ok: true };
}

/** "Not you?" — forget this device's name so the prompt shows again. */
export async function clearIdentity() {
  cookies().delete(IDENTITY_COOKIE);
}
