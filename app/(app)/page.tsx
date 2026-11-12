import Link from 'next/link';
import { requireMember } from '@/lib/auth';
import { q } from '@/lib/db';
import { STATUSES } from '@/lib/constants';
import { StatusBadge, StatusBar } from '@/components/Badges';
import { displayName, fmtDate, type Module, type Profile } from '@/lib/types';

type Row = { id: string; module_id: string; status: string; priority: string; case_code: string; title: string; updated_at: string | null };

export default async function DashboardPage() {
  await requireMember();
  const [modules, cases, history, people] = await Promise.all([
    q<Module>('select * from modules order by sort_order, name'),
    q<Row>('select id, module_id, status, priority, case_code, title, updated_at from test_cases'),
    q<{ id: number; test_case_id: string; new_status: string; changed_by: string | null; changed_at: string; case_code: string }>(
      `select h.id, h.test_case_id, h.new_status, h.changed_by, h.changed_at, t.case_code
       from status_history h join test_cases t on t.id = h.test_case_id order by h.changed_at desc limit 12`,
    ),
    q<{ id: string; full_name: string; email: string }>('select id, full_name, email from users'),
  ]);

  const rows = cases;
  const total = rows.length;
  const count = (list: Row[]) => list.reduce<Record<string, number>>((a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {});
  const all = count(rows);
  const executed = total - (all.not_started ?? 0) - (all.in_progress ?? 0);
  const pct = total ? Math.round((executed / total) * 100) : 0;
  const passRate = executed ? Math.round(((all.passed ?? 0) / executed) * 100) : 0;
  const peopleById = new Map(people.map((p) => [p.id, p as Pick<Profile, 'full_name' | 'email'>]));
  const failedHigh = rows.filter((r) => r.status === 'failed').sort((a, b) => (a.priority === 'High' ? -1 : 1) - (b.priority === 'High' ? -1 : 1)).slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-500">Overall testing progress across every page of the application.</p>
      </div>

      {total === 0 && (
        <div className="card p-6 text-sm text-slate-600">
          No test cases yet. Load them with <code className="rounded bg-slate-100 px-1">npm run db:setup</code> or add them from <Link className="text-brand-600 underline" href="/admin">Manage</Link>.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        <Stat label="Total" value={total} />
        <Stat label="Executed" value={`${pct}%`} hint={`${executed} of ${total}`} />
        <Stat label="Pass rate" value={`${passRate}%`} hint="of executed" />
        {STATUSES.filter((s) => s.value !== 'skipped').map((s) => (
          <Link key={s.value} href={`/tests?status=${s.value}`}>
            <Stat label={s.label} value={all[s.value] ?? 0} dot={s.bar} />
          </Link>
        ))}
      </div>

      <div className="card p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold">Overall progress</span>
          <span className="text-slate-500">{executed}/{total} executed</span>
        </div>
        <StatusBar counts={all} total={total} />
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
          {STATUSES.map((s) => (
            <span key={s.value} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${s.bar}`} />{s.label}</span>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card overflow-hidden lg:col-span-2">
          <div className="border-b border-slate-200 px-5 py-3 font-semibold">Progress by page / module</div>
          <div className="divide-y divide-slate-100">
            {modules.map((m) => {
              const list = rows.filter((r) => r.module_id === m.id);
              const c = count(list);
              const done = list.length - (c.not_started ?? 0) - (c.in_progress ?? 0);
              return (
                <Link key={m.id} href={`/tests?module=${m.id}`} className="block px-5 py-3 hover:bg-slate-50">
                  <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium">{m.name}</span>
                    <span className="shrink-0 text-xs text-slate-500">
                      {done}/{list.length} · <span className="text-emerald-700">{c.passed ?? 0} passed</span>
                      {(c.failed ?? 0) > 0 && <span className="text-red-700"> · {c.failed} failed</span>}
                    </span>
                  </div>
                  <StatusBar counts={c} total={list.length} />
                </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-3 font-semibold text-red-700">Failed tests</div>
            {failedHigh.length === 0 ? (
              <p className="px-5 py-4 text-sm text-slate-500">No failures.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {failedHigh.map((r) => (
                  <li key={r.id}>
                    <Link href={`/tests/${r.id}`} className="block px-5 py-2.5 text-sm hover:bg-slate-50">
                      <span className="font-mono text-xs text-slate-500">{r.case_code}</span> · {r.title}
                      {r.priority === 'High' && <span className="ml-1 text-xs font-semibold text-red-600">HIGH</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-3 font-semibold">Recent activity</div>
            {history.length === 0 ? (
              <p className="px-5 py-4 text-sm text-slate-500">No activity yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {history.map((h) => (
                  <li key={h.id} className="px-5 py-2.5 text-sm">
                    <Link href={`/tests/${h.test_case_id}`} className="hover:underline">
                      <span className="font-mono text-xs text-slate-500">{h.case_code}</span>
                    </Link>{' '}
                    → <StatusBadge status={h.new_status} />
                    <div className="mt-0.5 text-xs text-slate-500">
                      {displayName(peopleById.get(h.changed_by ?? ''))} · {fmtDate(h.changed_at)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, hint, dot }: { label: string; value: number | string; hint?: string; dot?: string }) {
  return (
    <div className="card h-full p-4">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        {dot && <span className={`h-2 w-2 rounded-full ${dot}`} />}
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {hint && <div className="text-xs text-slate-400">{hint}</div>}
    </div>
  );
}
