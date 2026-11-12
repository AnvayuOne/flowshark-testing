'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthShell, { Alert } from '@/components/AuthShell';
import { signUp } from '@/lib/auth-actions';
import { ALLOWED_DOMAIN, isCompanyEmail } from '@/lib/constants';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailInvalid = email.length > 3 && email.includes('@') && !isCompanyEmail(email);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) return setError('Please enter your full name.');
    if (!isCompanyEmail(email)) return setError(`Only company emails ending in @${ALLOWED_DOMAIN} can sign up.`);
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password))
      return setError('Password must be at least 8 characters with letters and numbers.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const res = await signUp({ fullName, email, password });
      if (res.error) return setError(res.error);
      router.push('/login?created=1');
    } catch {
      setError('Could not create the account right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Anvayu Test Tracker">
      {error && <Alert>{error}</Alert>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" required maxLength={120} className="input" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="email">Company email</label>
          <input id="email" type="email" required autoComplete="email" placeholder={`you@${ALLOWED_DOMAIN}`}
            className={`input ${emailInvalid ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''}`}
            value={email} onChange={(e) => setEmail(e.target.value)} />
          {emailInvalid && <p className="mt-1 text-xs text-red-600">Must be an @{ALLOWED_DOMAIN} address.</p>}
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" required autoComplete="new-password" minLength={8} maxLength={128} className="input"
            value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="mt-1 text-xs text-slate-500">At least 8 characters, with letters and numbers.</p>
        </div>
        <div>
          <label className="label" htmlFor="confirm">Confirm password</label>
          <input id="confirm" type="password" required autoComplete="new-password" className="input"
            value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <button className="btn-primary w-full" disabled={loading || emailInvalid}>{loading ? 'Creating account…' : 'Sign up'}</button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-600">
        Already have an account? <Link href="/login" className="font-semibold text-brand-600 hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
