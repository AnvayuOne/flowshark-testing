'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addModule as addModuleAction, deleteModule, setUserRole, updateModule } from '@/lib/actions';
import { ROLES } from '@/lib/constants';
import { displayName, fmtDate, type Module, type Profile } from '@/lib/types';
import TestCaseForm from '@/components/TestCaseForm';

type Props = { modules: Module[]; people: Profile[]; me: Profile; caseCounts: Record<string, number> };

export default function AdminPanel({ modules, people, me, caseCounts }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newMod, setNewMod] = useState({ code: '', name: '', description: '' });
  const [showNewTest, setShowNewTest] = useState(false);
  const isAdmin = me.role === 'admin';

  async function run(fn: () => Promise<{ ok?: boolean; error?: string }>) {
    setBusy(true);
    setError(null);
    const res = await fn().catch(() => ({ error: 'Network error. Please try again.' }));
    setBusy(false);
    if (res.error) setError(res.error);
    else router.refresh();
    return !res.error;
  }

  async function addModule(e: React.FormEvent) {
    e.preventDefault();
    if (!newMod.code.trim() || !newMod.name.trim()) return setError('Module code and name are required.');
    const ok = await run(() => addModuleAction(newMod));
    if (ok) setNewMod({ code: '', name: '', description: '' });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Manage</h1>
        <p className="text-sm text-slate-500">Modules (pages of the application) and team roles.</p>
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}

      <section className="card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-3 font-semibold">Modules / pages</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-5 py-2">Order</th><th className="px-5 py-2">Code</th><th className="px-5 py-2">Name</th><th className="px-5 py-2">Tests</th><th className="px-5 py-2" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {modules.map((m) => (
                <tr key={m.id}>
                  <td className="px-5 py-2">
                    <input type="number" defaultValue={m.sort_order} className="input w-20 py-1"
                      onBlur={(e) => Number(e.target.value) !== m.sort_order && run(() => updateModule(m.id, { sort_order: Number(e.target.value) }))} />
                  </td>
                  <td className="px-5 py-2 font-mono text-xs">{m.code}</td>
                  <td className="px-5 py-2">
                    <input defaultValue={m.name} className="input py-1"
                      onBlur={(e) => e.target.value.trim() && e.target.value !== m.name && run(() => updateModule(m.id, { name: e.target.value.trim() }))} />
                  </td>
                  <td className="px-5 py-2 text-slate-500">{caseCounts[m.id] ?? 0}</td>
                  <td className="px-5 py-2 text-right">
                    <button disabled={busy} className="text-sm text-red-600 hover:underline"
                      onClick={() => confirm(`Delete module "${m.name}" and its ${caseCounts[m.id] ?? 0} test cases? This cannot be undone.`) &&
                        run(() => deleteModule(m.id))}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {modules.length === 0 && <tr><td colSpan={5} className="px-5 py-4 text-slate-500">No modules yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <form onSubmit={addModule} className="grid gap-2 border-t border-slate-200 bg-slate-50 p-4 sm:grid-cols-[140px_1fr_1fr_auto]">
          <input className="input font-mono" placeholder="Code e.g. LEADS" value={newMod.code} onChange={(e) => setNewMod({ ...newMod, code: e.target.value })} />
          <input className="input" placeholder="Name e.g. Leads Page" value={newMod.name} onChange={(e) => setNewMod({ ...newMod, name: e.target.value })} />
          <input className="input" placeholder="Description (optional)" value={newMod.description} onChange={(e) => setNewMod({ ...newMod, description: e.target.value })} />
          <button className="btn-primary" disabled={busy}>Add module</button>
        </form>
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <span className="font-semibold">Test cases</span>
          {!showNewTest && (
            <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => setShowNewTest(true)} disabled={modules.length === 0}>
              + Add test case
            </button>
          )}
        </div>
        {modules.length === 0 ? (
          <p className="px-5 py-4 text-sm text-slate-500">Add a module above first, then you can add test cases to it here.</p>
        ) : showNewTest ? (
          <div className="p-4">
            <TestCaseForm modules={modules} onDone={() => setShowNewTest(false)} />
          </div>
        ) : (
          <p className="px-5 py-4 text-sm text-slate-500">Click "+ Add test case" to create one in any module.</p>
        )}
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-3 font-semibold">Team</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-5 py-2">Name</th><th className="px-5 py-2">Email</th><th className="px-5 py-2">Joined</th><th className="px-5 py-2">Role</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {people.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-2 font-medium">{displayName(p)}{p.id === me.id && <span className="ml-1 text-xs text-slate-400">(you)</span>}</td>
                  <td className="px-5 py-2 text-slate-600">{p.email}</td>
                  <td className="px-5 py-2 text-slate-500">{fmtDate(p.created_at)}</td>
                  <td className="px-5 py-2">
                    {isAdmin ? (
                      <select className="input w-36 py-1 capitalize" defaultValue={p.role} disabled={busy}
                        onChange={(e) => run(() => setUserRole(p.id, e.target.value))}>
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      <span className="capitalize">{p.role}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
          <b>Admin</b>: everything + roles · <b>Lead</b>: create/edit/delete modules &amp; test cases · <b>Tester / Developer</b>: update status, assignee and notes.
          New people join by signing up with their @anvayuone.com email.
        </p>
      </section>
    </div>
  );
}
