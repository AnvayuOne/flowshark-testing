// Signed session cookie. Edge-safe (used by middleware) — no Node-only imports here.
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'tt_session';
export const SESSION_DAYS = 7;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error('AUTH_SECRET must be set to a random string of at least 32 characters');
  return new TextEncoder().encode(s);
}

export async function signSession(userId: string, sessionVersion: number) {
  return new SignJWT({ sv: sessionVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function readSession(token: string | undefined): Promise<{ userId: string; sv: number } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] });
    if (typeof payload.sub !== 'string' || typeof payload.sv !== 'number') return null;
    return { userId: payload.sub, sv: payload.sv };
  } catch {
    return null;
  }
}
