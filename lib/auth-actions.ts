'use server';

import bcrypt from 'bcryptjs';
import { q, q1, tx } from '@/lib/db';
import { appUrl, clientIp, endSession, hashToken, newToken, startSession } from '@/lib/auth';
import { sendActionEmail } from '@/lib/mail';
import { ALLOWED_DOMAIN, isCompanyEmail } from '@/lib/constants';

type Result = { ok?: true; error?: string; code?: 'unverified' };

const normEmail = (e: unknown) => String(e ?? '').trim().toLowerCase();
const pwProblem = (p: string) =>
  p.length < 8 || p.length > 128 || !/[A-Za-z]/.test(p) || !/\d/.test(p)
    ? 'Password must be 8–128 characters and contain letters and numbers.'
    : null;
// Used so a missing account takes as long to check as a real one (no email enumeration by timing).
let dummyHash: string | null = null;
const getDummyHash = () => (dummyHash ??= bcrypt.hashSync('not-a-real-password', 12));

async function issueToken(userId: string, purpose: 'verify' | 'reset', hours: number) {
  const token = newToken();
  await q('update auth_tokens set used_at = now() where user_id = $1 and purpose = $2 and used_at is null', [userId, purpose]);
  await q(`insert into auth_tokens (token_hash, user_id, purpose, expires_at) values ($1, $2, $3, now() + ($4 || ' hours')::interval)`, [
    hashToken(token), userId, purpose, String(hours),
  ]);
  return token;
}

async function recentlySent(userId: string, purpose: string) {
  const row = await q1<{ n: number }>(
    `select count(*)::int n from auth_tokens where user_id = $1 and purpose = $2 and created_at > now() - interval '60 seconds'`,
    [userId, purpose],
  );
  return (row?.n ?? 0) > 0;
}

async function sendVerifyEmail(email: string, token: string) {
  await sendActionEmail({
    to: email,
    subject: 'Verify your email – Anvayu Test Tracker',
    intro: 'Confirm your email address to activate your Anvayu Test Tracker account.',
    buttonText: 'Verify email',
    url: `${appUrl()}/verify-email?token=${encodeURIComponent(token)}`,
    footer: 'This link expires in 24 hours. If you did not sign up, you can ignore this email.',
  });
}

// ---------------------------------------------------------------- sign up
export async function signUp(input: { fullName: string; email: string; password: string }): Promise<Result> {
  const email = normEmail(input.email);
  const fullName = String(input.fullName ?? '').trim();
  const password = String(input.password ?? '');
  if (!fullName || fullName.length > 120) return { error: 'Please enter your full name.' };
  if (!isCompanyEmail(email) || !/^[^\s@]+@[^\s@]+$/.test(email)) return { error: `Only @${ALLOWED_DOMAIN} email addresses can sign up.` };
  const pw = pwProblem(password);
  if (pw) return { error: pw };

  const existing = await q1<{ id: string; email_verified_at: string | null }>('select id, email_verified_at from users where email = $1', [email]);
  if (existing) {
    // Don't reveal whether the account exists. Re-send the link if it's still unverified.
    if (!existing.email_verified_at && !(await recentlySent(existing.id, 'verify'))) {
      await q('update users set full_name = $2, password_hash = $3 where id = $1', [existing.id, fullName, await bcrypt.hash(password, 12)]);
      await sendVerifyEmail(email, await issueToken(existing.id, 'verify', 24));
    }
    return { ok: true };
  }

  const user = await q1<{ id: string }>('insert into users (email, full_name, password_hash) values ($1, $2, $3) returning id', [
    email, fullName, await bcrypt.hash(password, 12),
  ]);
  await sendVerifyEmail(email, await issueToken(user!.id, 'verify', 24));
  return { ok: true };
}

export async function resendVerification(input: { email: string }): Promise<Result> {
  const email = normEmail(input.email);
  if (!isCompanyEmail(email)) return { ok: true };
  const u = await q1<{ id: string; email_verified_at: string | null }>('select id, email_verified_at from users where email = $1', [email]);
  if (u && !u.email_verified_at && !(await recentlySent(u.id, 'verify'))) {
    await sendVerifyEmail(email, await issueToken(u.id, 'verify', 24));
  }
  return { ok: true };
}

// ---------------------------------------------------------------- verify email
export async function verifyEmail(input: { token: string }): Promise<Result> {
  const token = String(input.token ?? '');
  if (!token) return { error: 'Invalid link.' };
  return tx(async (c) => {
    const t = (
      await c.query<{ user_id: string }>(
        `update auth_tokens set used_at = now()
         where token_hash = $1 and purpose = 'verify' and used_at is null and expires_at > now()
         returning user_id`,
        [hashToken(token)],
      )
    ).rows[0];
    if (!t) return { error: 'This link is invalid or has expired. Sign in to get a new one.' };

    // Lock the users table briefly so only one person can become the first admin.
    await c.query('lock table users in share row exclusive mode');
    const admins = (await c.query<{ n: number }>(`select count(*)::int n from users where role = 'admin' and email_verified_at is not null`)).rows[0].n;
    const u = (await c.query<{ email: string }>('select email from users where id = $1', [t.user_id])).rows[0];
    const adminList = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
    const makeAdmin = admins === 0 || adminList.includes(u.email);
    await c.query(
      `update users set email_verified_at = coalesce(email_verified_at, now()), role = case when $2 then 'admin' else role end where id = $1`,
      [t.user_id, makeAdmin],
    );
    return { ok: true } as Result;
  });
}

// ---------------------------------------------------------------- sign in
export async function signIn(input: { email: string; password: string }): Promise<Result> {
  const email = normEmail(input.email);
  const password = String(input.password ?? '');
  const ip = clientIp();
  if (!isCompanyEmail(email)) return { error: `Please use your @${ALLOWED_DOMAIN} email.` };

  const limits = await q1<{ by_email: number; by_ip: number }>(
    `select
       count(*) filter (where email = $1 and not success)::int as by_email,
       count(*) filter (where ip = $2 and not success)::int    as by_ip
     from login_attempts where at > now() - interval '15 minutes'`,
    [email, ip],
  );
  if ((limits?.by_email ?? 0) >= 8 || (limits?.by_ip ?? 0) >= 30)
    return { error: 'Too many failed attempts. Please wait 15 minutes and try again.' };

  const user = await q1<{ id: string; password_hash: string; email_verified_at: string | null; session_version: number }>(
    'select id, password_hash, email_verified_at, session_version from users where email = $1',
    [email],
  );
  const ok = await bcrypt.compare(password, user?.password_hash ?? getDummyHash());
  await q('insert into login_attempts (email, ip, success) values ($1, $2, $3)', [email, ip, Boolean(user && ok)]);
  if (!user || !ok) return { error: 'Incorrect email or password.' };
  if (!user.email_verified_at) return { error: 'Please verify your email first. Check your inbox for the link.', code: 'unverified' };

  await startSession(user.id, user.session_version);
  return { ok: true };
}

export async function signOut() {
  endSession();
}

// ---------------------------------------------------------------- password reset
export async function requestPasswordReset(input: { email: string }): Promise<Result> {
  const email = normEmail(input.email);
  if (!isCompanyEmail(email)) return { error: `Please use your @${ALLOWED_DOMAIN} email.` };
  const u = await q1<{ id: string }>('select id from users where email = $1', [email]);
  if (u && !(await recentlySent(u.id, 'reset'))) {
    const token = await issueToken(u.id, 'reset', 1);
    await sendActionEmail({
      to: email,
      subject: 'Reset your password – Anvayu Test Tracker',
      intro: 'Someone asked to reset the password for your Anvayu Test Tracker account.',
      buttonText: 'Choose a new password',
      url: `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`,
      footer: 'This link expires in 1 hour and can be used once. If you did not ask for this, ignore this email.',
    });
  }
  return { ok: true }; // same answer whether or not the account exists
}

export async function resetPassword(input: { token: string; password: string }): Promise<Result> {
  const password = String(input.password ?? '');
  const pw = pwProblem(password);
  if (pw) return { error: pw };
  const hash = await bcrypt.hash(password, 12);
  return tx(async (c) => {
    const t = (
      await c.query<{ user_id: string }>(
        `update auth_tokens set used_at = now()
         where token_hash = $1 and purpose = 'reset' and used_at is null and expires_at > now()
         returning user_id`,
        [hashToken(String(input.token ?? ''))],
      )
    ).rows[0];
    if (!t) return { error: 'This reset link is invalid or has expired. Request a new one.' } as Result;
    // New password, sign out every existing session, and the mailbox is now proven.
    await c.query(
      `update users set password_hash = $2, session_version = session_version + 1,
              email_verified_at = coalesce(email_verified_at, now()) where id = $1`,
      [t.user_id, hash],
    );
    await c.query(`update auth_tokens set used_at = now() where user_id = $1 and purpose = 'reset' and used_at is null`, [t.user_id]);
    return { ok: true } as Result;
  });
}
