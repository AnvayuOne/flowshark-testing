'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setIdentity } from '@/lib/auth-actions';

export default function NamePrompt() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError('Please enter your name.');
    setSaving(true);
    setError(null);
    const res = await setIdentity(name).catch(() => ({ error: 'Network error. Please try again.' }));
    setSaving(false);
    if (res.error) return setError(res.error);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">A</div>
          <h1 className="text-2xl font-bold text-slate-900">What's your name?</h1>
          <p className="mt-1 text-sm text-slate-500">Anvayu Test Tracker</p>
        </div>
        <form onSubmit={onSubmit} className="card space-y-4 p-6">
          <div>
            <label className="label" htmlFor="name">Your name</label>
            <input id="name" className="input" placeholder="e.g. Priya Shah" maxLength={120} autoFocus
              value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button className="btn-primary w-full" disabled={saving || !name.trim()}>{saving ? 'Continuing…' : 'Continue'}</button>
          <p className="text-center text-xs text-slate-400">
            Everyone on the team sees this name next to tests you update. We'll remember it on this device.
          </p>
        </form>
      </div>
    </main>
  );
}
