'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateTestCase } from '@/lib/actions';
import { CATEGORIES, PRIORITIES, STATUSES, moduleAccent, statusMeta } from '@/lib/constants';
import { PriorityBadge } from '@/components/Badges';
import { displayName, fmtDate, type Module, type Profile, type TestCase } from '@/lib/types';

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
      <circle cx="7" cy="7" r="4.5" />
      <path d="M13 13 10.3 10.3" />
    </svg>
  );
}

function ChipXIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5" />
    </svg>
  );
}

type Props = {
  modules: Module[];
  initialCases: TestCase[];
  people: Profile[];
  me: Profile;
  initialStatus: string;
  initialModule: string;
};

export default function TestList({ modules, initialCases, people, me, initialStatus, initialModule }: Props) {
  const router = useRouter();
  const [cases, setCases] = useState(initialCases);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [moduleId, setModuleId] = useState(initialModule);
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [assignee, setAssignee] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const isManager = me.role === 'admin' || me.role === 'lead';

  // Pick up fresh server data (after router.refresh()).
  useEffect(() => setCases(initialCases), [initialCases]);

  // Other testers' changes: refresh every 20s while the tab is visible.
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, 20_000);
    return () => clearInterval(t);
  }, [router]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return cases.filter(
      (c) =>
        (!status || c.status === status) &&
        (!moduleId || c.module_id === moduleId) &&
        (!priority || c.priority === priority) &&
        (!category || c.category === category) &&
        (!assignee || (assignee === 'me' ? c.assigned_to === me.id : assignee === 'none' ? !c.assigned_to : c.assigned_to === assignee)) &&
        (!term || c.title.toLowerCase().includes(term) || c.case_code.toLowerCase().includes(term)),
    );
  }, [cases, q, status, moduleId, priority, category, assignee, me.id]);

  async function updateField(id: string, patch: Partial<Pick<TestCase, 'status' | 'assigned_to'>>) {
    setError(null);
    const before = cases;
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch, updated_by: me.id, updated_at: new Date().toISOString() } : c)));
    const res = await updateTestCase(id, patch).catch(() => ({ error: 'Network error. Please try again.' }));
    if ('error' in res && res.error) {
      setCases(before);
      setError('Could not save: ' + res.error);
    }
  }

  function exportCsv() {
    const modName = new Map(modules.map((m) => [m.id, m.name]));
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['ID', 'Module', 'Title', 'Category', 'Priority', 'Preconditions', 'Steps', 'Expected result', 'Status', 'Assigned to', 'Last updated by', 'Last updated'];
    const lines = filtered.map((c) =>
      [
        c.case_code,
        modName.get(c.module_id),
        c.title,
        c.category,
        c.priority,
        c.preconditions,
        (c.steps ?? []).map((s, i) => `${i + 1}. ${s}`).join('\n'),
        c.expected_result,
        statusMeta(c.status).label,
        c.assigned_to ? displayName(peopleById.get(c.assigned_to)) : '',
        c.updated_by ? displayName(peopleById.get(c.updated_by)) : '',
        c.updated_at ? new Date(c.updated_at).toISOString() : '',
      ]
        .map(esc)
        .join(','),
    );
    const blob = new Blob(['﻿' + [header.map(esc).join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `test-cases-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const moduleIndex = useMemo(() => new Map(modules.map((m, i) => [m.id, i])), [modules]);
  const visibleModules = modules.filter((m) => filtered.some((c) => c.module_id === m.id));

  const chips = useMemo(() => {
    const list: { key: string; label: string; clear: () => void }[] = [];
    if (q.trim()) list.push({ key: 'q', label: `“${q.trim()}”`, clear: () => setQ('') });
    if (moduleId) list.push({ key: 'module', label: modules.find((m) => m.id === moduleId)?.name ?? 'Module', clear: () => setModuleId('') });
    if (status) list.push({ key: 'status', label: statusMeta(status).label, clear: () => setStatus('') });
    if (priority) list.push({ key: 'priority', label: `${priority} priority`, clear: () => setPriority('') });
    if (category) list.push({ key: 'category', label: category, clear: () => setCategory('') });
    if (assignee)
      list.push({
        key: 'assignee',
        label: assignee === 'me' ? 'Assigned to me' : assignee === 'none' ? 'Unassigned' : displayName(peopleById.get(assignee)),
        clear: () => setAssignee(''),
      });
    return list;
  }, [q, moduleId, status, priority, category, assignee, modules, peopleById]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Test Cases</h1>
          <p className="text-sm text-slate-500">{filtered.length} of {cases.length} shown</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="btn-secondary">Export CSV</button>
          {isManager && <Link href="/tests/new" className="btn-primary">+ New test case</Link>}
        </div>
      </div>

      <div className="card space-y-3 p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><SearchIcon /></span>
            <input className="input pl-9" placeholder="Search by ID or title…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="input" value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
            <option value="">All modules</option>
            {modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All types</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className="input lg:col-span-2" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Anyone</option>
            <option value="me">Assigned to me</option>
            <option value="none">Unassigned</option>
            {people.map((p) => <option key={p.id} value={p.id}>{displayName(p)}</option>)}
          </select>
        </div>
        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
            {chips.map((c) => (
              <button key={c.key} onClick={c.clear} className="filter-chip hover:bg-brand-100">
                {c.label}
                <ChipXIcon />
              </button>
            ))}
            {chips.length > 1 && (
              <button
                className="text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline"
                onClick={() => { setQ(''); setStatus(''); setModuleId(''); setPriority(''); setCategory(''); setAssignee(''); }}>
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}

      {visibleModules.length === 0 && <div className="card p-8 text-center text-sm text-slate-500">No test cases match.</div>}

      {visibleModules.map((m) => {
        const list = filtered.filter((c) => c.module_id === m.id);
        const passed = list.filter((c) => c.status === 'passed').length;
        return (
          <section key={m.id} className="card overflow-hidden">
            <button onClick={() => setCollapsed((s) => ({ ...s, [m.id]: !s[m.id] }))}
              className="flex w-full items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left">
              <span className="flex items-center gap-2 font-semibold">
                <span className="text-slate-400">{collapsed[m.id] ? '▸' : '▾'}</span>
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${moduleAccent(moduleIndex.get(m.id) ?? 0)}`} />
                {m.name}
              </span>
              <span className="text-xs text-slate-500">{passed}/{list.length} passed</span>
            </button>
            {!collapsed[m.id] && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">ID</th>
                      <th className="px-4 py-2 font-medium">Title</th>
                      <th className="px-4 py-2 font-medium">Priority</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Assigned</th>
                      <th className="px-4 py-2 font-medium">Last update</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {list.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className={`whitespace-nowrap border-l-4 px-4 py-2 font-mono text-xs text-slate-500 ${statusMeta(c.status).border}`}>{c.case_code}</td>
                        <td className="px-4 py-2">
                          <Link href={`/tests/${c.id}`} className="font-medium text-slate-900 hover:text-brand-700 hover:underline">{c.title}</Link>
                          <div className="text-xs text-slate-400">{c.category}</div>
                        </td>
                        <td className="px-4 py-2"><PriorityBadge priority={c.priority} /></td>
                        <td className="px-4 py-2">
                          <select aria-label="Status" value={c.status}
                            onChange={(e) => updateField(c.id, { status: e.target.value as TestCase['status'] })}
                            className={`rounded-full border-0 py-1 pl-2.5 pr-7 text-xs font-medium ring-1 ring-inset ${statusMeta(c.status).color}`}>
                            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <select aria-label="Assignee" value={c.assigned_to ?? ''}
                            onChange={(e) => updateField(c.id, { assigned_to: e.target.value || null })}
                            className="max-w-[150px] rounded-md border border-slate-200 bg-white py-1 pl-2 pr-7 text-xs">
                            <option value="">Unassigned</option>
                            {people.map((p) => <option key={p.id} value={p.id}>{displayName(p)}</option>)}
                          </select>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-xs text-slate-500">
                          {c.updated_by ? <>{displayName(peopleById.get(c.updated_by))}<br />{fmtDate(c.updated_at)}</> : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
