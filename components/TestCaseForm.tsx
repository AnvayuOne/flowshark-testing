'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteTestCase, saveTestCase } from '@/lib/actions';
import { CATEGORIES, PRIORITIES } from '@/lib/constants';
import type { Module, TestCase } from '@/lib/types';

export default function TestCaseForm({ modules, existing, onDone }: { modules: Module[]; existing?: TestCase; onDone?: () => void }) {
  const router = useRouter();
  const [f, setF] = useState({
    case_code: existing?.case_code ?? '',
    module_id: existing?.module_id ?? modules[0]?.id ?? '',
    title: existing?.title ?? '',
    category: existing?.category ?? 'Functional',
    priority: existing?.priority ?? 'Medium',
    preconditions: existing?.preconditions ?? '',
    steps: (existing?.steps ?? []).join('\n'),
    expected_result: existing?.expected_result ?? '',
    test_data: existing?.test_data ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      ...f,
      case_code: f.case_code.trim().toUpperCase(),
      title: f.title.trim(),
      steps: f.steps.split('\n').map((s) => s.trim()).filter(Boolean),
      preconditions: f.preconditions.trim() || null,
      expected_result: f.expected_result.trim() || null,
      test_data: f.test_data.trim() || null,
    };
    if (!payload.case_code || !payload.title || !payload.module_id) return setError('ID, module and title are required.');
    if (payload.steps.length === 0) return setError('Add at least one step.');
    setSaving(true);
    const res = await saveTestCase(existing?.id ?? null, payload).catch(() => ({ error: 'Network error. Please try again.' }));
    setSaving(false);
    if (!('id' in res)) return setError(res.error ?? 'Could not save.');
    if (onDone) {
      onDone();
      router.refresh();
    } else {
      router.push(`/tests/${res.id}`);
      router.refresh();
    }
  }

  async function onDelete() {
    if (!existing || !confirm(`Delete ${existing.case_code}? Its notes and history will be deleted too. This cannot be undone.`)) return;
    const res = await deleteTestCase(existing.id).catch(() => ({ error: 'Network error. Please try again.' }));
    if ('error' in res && res.error) return setError(res.error);
    router.push('/tests');
    router.refresh();
  }

  if (modules.length === 0) {
    return <div className="card p-6 text-sm">Create a module first on the <a className="text-brand-600 underline" href="/admin">Manage</a> page.</div>;
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Test case ID</label>
          <input className="input font-mono" placeholder="TC-LOGIN-001" value={f.case_code} onChange={set('case_code')} required />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Module / page</label>
          <select className="input" value={f.module_id} onChange={set('module_id')}>
            {modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Title</label>
        <input className="input" value={f.title} onChange={set('title')} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Type</label>
          <select className="input" value={f.category} onChange={set('category')}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="input" value={f.priority} onChange={set('priority')}>
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Preconditions</label>
        <textarea className="input min-h-[60px]" value={f.preconditions} onChange={set('preconditions')} />
      </div>
      <div>
        <label className="label">Steps <span className="font-normal text-slate-400">(one per line)</span></label>
        <textarea className="input min-h-[140px]" value={f.steps} onChange={set('steps')} />
      </div>
      <div>
        <label className="label">Test data</label>
        <textarea className="input min-h-[50px] font-mono text-xs" value={f.test_data} onChange={set('test_data')} />
      </div>
      <div>
        <label className="label">Expected result</label>
        <textarea className="input min-h-[70px]" value={f.expected_result} onChange={set('expected_result')} />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap justify-between gap-2">
        {existing ? <button type="button" onClick={onDelete} className="btn-danger">Delete test case</button> : <span />}
        <div className="flex gap-2">
          <button type="button" onClick={() => (onDone ? onDone() : router.back())} className="btn-secondary">Cancel</button>
          <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : existing ? 'Save changes' : 'Create test case'}</button>
        </div>
      </div>
    </form>
  );
}
