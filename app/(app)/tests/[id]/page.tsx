import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireMember } from '@/lib/auth';
import { USER_COLS, q, q1 } from '@/lib/db';
import { PriorityBadge, StatusBadge } from '@/components/Badges';
import TestActions from '@/components/TestActions';
import NotesPanel from '@/components/NotesPanel';
import { displayName, fmtDate, type HistoryRow, type Note, type Profile, type TestCase } from '@/lib/types';

export default async function TestDetailPage({ params }: { params: { id: string } }) {
  const { profile } = await requireMember();
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();

  const [test, notes, history, peopleList] = await Promise.all([
    q1<TestCase & { module_name: string | null }>(
      'select t.*, m.name as module_name from test_cases t join modules m on m.id = t.module_id where t.id = $1',
      [params.id],
    ),
    q<Note>('select * from test_notes where test_case_id = $1 order by created_at', [params.id]),
    q<HistoryRow>('select * from status_history where test_case_id = $1 order by changed_at desc', [params.id]),
    q<Profile>(`select ${USER_COLS} from users order by full_name`),
  ]);
  if (!test) notFound();

  const peopleById = new Map(peopleList.map((p) => [p.id, p]));
  const isManager = profile.role === 'admin' || profile.role === 'lead';

  return (
    <div className="space-y-5">
      <div className="text-sm text-slate-500">
        <Link href="/tests" className="hover:underline">Test Cases</Link> / {test.module_name}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-sm text-slate-500">{test.case_code}</div>
          <h1 className="text-2xl font-bold">{test.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={test.status} />
            <PriorityBadge priority={test.priority} />
            <span className="pill bg-slate-50 text-slate-600 ring-slate-200">{test.category}</span>
          </div>
        </div>
        {isManager && <Link href={`/tests/${test.id}/edit`} className="btn-secondary">Edit test case</Link>}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="card space-y-5 p-5">
            {test.preconditions && <Section title="Preconditions"><p className="whitespace-pre-wrap">{test.preconditions}</p></Section>}
            <Section title="Steps">
              <ol className="list-decimal space-y-1.5 pl-5">
                {(test.steps ?? []).map((s, i) => <li key={i} className="whitespace-pre-wrap">{s}</li>)}
              </ol>
            </Section>
            {test.test_data && <Section title="Test data"><p className="whitespace-pre-wrap font-mono text-xs">{test.test_data}</p></Section>}
            <Section title="Expected result"><p className="whitespace-pre-wrap">{test.expected_result || '—'}</p></Section>
          </div>

          <NotesPanel testCaseId={test.id} initialNotes={notes} people={peopleList} me={profile} />
        </div>

        <div className="space-y-5">
          <TestActions test={test} people={peopleList} />

          <div className="card overflow-hidden">
            <div className="border-b border-slate-200 px-4 py-2.5 text-sm font-semibold">Status history</div>
            {history.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-500">Not run yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {history.map((h) => (
                  <li key={h.id} className="px-4 py-2.5 text-sm">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {h.old_status && <><StatusBadge status={h.old_status} /> →</>} <StatusBadge status={h.new_status} />
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      <div className="text-sm text-slate-800">{children}</div>
    </div>
  );
}
