import { requireMember } from '@/lib/auth';
import { USER_COLS, q } from '@/lib/db';
import TestList from '@/components/TestList';
import type { Module, Profile, TestCase } from '@/lib/types';

export default async function TestsPage({ searchParams }: { searchParams: { status?: string; module?: string } }) {
  const { profile } = await requireMember();
  const [modules, cases, people, noteCounts] = await Promise.all([
    q<Module>('select * from modules order by sort_order, name'),
    q<TestCase>('select * from test_cases order by sort_order, case_code'),
    q<Profile>(`select ${USER_COLS} from users order by full_name`),
    q<{ test_case_id: string; n: number }>('select test_case_id, count(*)::int n from test_notes group by test_case_id'),
  ]);

  return (
    <TestList
      modules={modules}
      initialCases={cases}
      people={people}
      me={profile}
      initialStatus={searchParams.status ?? ''}
      initialModule={searchParams.module ?? ''}
      noteCounts={Object.fromEntries(noteCounts.map((c) => [c.test_case_id, c.n]))}
    />
  );
}
