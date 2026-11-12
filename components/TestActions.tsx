'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateTestCase } from '@/lib/actions';
import { STATUSES } from '@/lib/constants';
import { displayName, fmtDate, type Profile, type TestCase } from '@/lib/types';

export default function TestActions({ test, people }: { test: TestCase; people: Profile[] }) {
  const router = useRouter();
  const [status, setStatus] = useState(test.status);
  const [assignee, setAssignee] = useState(test.assigned_to ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updatedBy = people.find((p) => p.id === test.updated_by);

  async function save(patch: { status?: string; assigned_to?: string | null }) {
    setSaving(true);
    setError(null);
    const res = await updateTestCase(test.id, patch).catch(() => ({ error: 'Network error. Please try again.' }));
    setSaving(false);
    if ('error' in res && res.error) {
      setError(res.error);
      setStatus(test.status);
      setAssignee(test.assigned_to ?? '');
    } else router.refresh();
  }

  return (
    <div className="card space-y-4 p-4">
      <div>
        <div className="label">Set status</div>
        <div className="grid grid-cols-2 gap-2">
          {STATUSES.map((s) => (
            <button key={s.value} disabled={saving}
              onClick={() => { setStatus(s.value); save({ status: s.value }); }}
              className={`rounded-lg px-2 py-2 text-xs font-semibold ring-1 ring-inset transition ${
                status === s.value ? `${s.color} ring-2` : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="assignee">Assigned to</label>
        <select id="assignee" className="input" value={assignee} disabled={saving}
          onChange={(e) => { setAssignee(e.target.value); save({ assigned_to: e.target.value || null }); }}>
          <option value="">Unassigned</option>
          {people.map((p) => <option key={p.id} value={p.id}>{displayName(p)}</option>)}
        </select>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <p className="text-xs text-slate-500">
        Last updated: {updatedBy ? `${displayName(updatedBy)} · ` : ''}{fmtDate(test.updated_at)}
      </p>
    </div>
  );
}
