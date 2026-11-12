'use client';

// The link needs a button click (not just opening it) because Outlook/Gmail link
// scanners open every URL in an email and would otherwise use up the token.
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthShell, { Alert } from '@/components/AuthShell';
import { verifyEmail } from '@/lib/auth-actions';

function Verify() {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await verifyEmail({ token });
      if (res.error) return setError(res.error);
      router.replace('/login?verified=1');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Verify your email">
      {error && <Alert>{error}</Alert>}
      <p className="mb-4 text-sm text-slate-600">Click the button to confirm this is your email address and activate your account.</p>
      <button onClick={confirm} disabled={loading || !token} className="btn-primary w-full">
        {loading ? 'Verifying…' : 'Confirm my email'}
      </button>
      <p className="mt-5 text-center text-sm">
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <Verify />
    </Suspense>
  );
}
