'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthShell, { Alert } from '@/components/AuthShell';
import { resendVerification, signIn } from '@/lib/auth-actions';
import { ALLOWED_DOMAIN, isCompanyEmail, safeNextPath } from '@/lib/constants';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(
    params.get('verified') === '1'
      ? 'Email verified. You can sign in now.'
      : params.get('reset') === '1'
        ? 'Password updated. Sign in with your new password.'
        : null,
  );
  const [unverified, setUnverified] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setUnverified(false);
    if (!isCompanyEmail(email)) return setError(`Please use your company email (name@${ALLOWED_DOMAIN}).`);
    setLoading(true);
    try {
      const res = await signIn({ email, password });
      if (res.error) {
        setError(res.error);
        setUnverified(res.code === 'unverified');
        return;
      }
      router.replace(safeNextPath(params.get('next')));
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    await resendVerification({ email });
    setUnverified(false);
    setError(null);
    setInfo('If your account is waiting for verification, a new link is on its way.');
  }

  return (
    <AuthShell title="Sign in" subtitle="Anvayu Test Tracker">
      {info && <Alert kind="success">{info}</Alert>}
      {error && (
        <Alert>
          {error}
          {unverified && (
            <button type="button" onClick={resend} className="ml-1 font-semibold underline">Resend link</button>
          )}
        </Alert>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Company email</label>
          <input id="email" type="email" autoComplete="email" required className="input"
            placeholder={`you@${ALLOWED_DOMAIN}`} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">Password</label>
            <Link href="/forgot-password" className="mb-1 text-xs font-medium text-brand-600 hover:underline">Forgot password?</Link>
          </div>
          <input id="password" type="password" autoComplete="current-password" required className="input"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn-primary w-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-600">
        New here? <Link href="/signup" className="font-semibold text-brand-600 hover:underline">Create an account</Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
