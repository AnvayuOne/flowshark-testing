'use client';

import Link from 'next/link';
import { useState } from 'react';
import AuthShell, { Alert } from '@/components/AuthShell';
import { requestPasswordReset } from '@/lib/auth-actions';
import { ALLOWED_DOMAIN, isCompanyEmail } from '@/lib/constants';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isCompanyEmail(email)) return setError(`Please use your @${ALLOWED_DOMAIN} email.`);
    setLoading(true);
    try {
      const res = await requestPasswordReset({ email });
      if (res.error) return setError(res.error);
      setSent(true);
    } catch {
      setError('Could not send the email right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Reset password">
      {sent ? (
        <Alert kind="success">If an account exists for that email, a reset link is on its way. It expires in 1 hour.</Alert>
      ) : (
        <>
          {error && <Alert>{error}</Alert>}
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Company email</label>
              <input id="email" type="email" required className="input" placeholder={`you@${ALLOWED_DOMAIN}`}
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button className="btn-primary w-full" disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</button>
          </form>
        </>
      )}
      <p className="mt-5 text-center text-sm">
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}
