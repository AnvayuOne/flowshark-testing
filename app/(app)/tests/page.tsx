import { requireMember } from '@/lib/auth';
import { USER_COLS, q } from '@/lib/db';
import TestList from '@/components/TestList';
import type { Module, Profile, TestCase } from '@/lib/types';

export default async function TestsPage({ searchParams }: { searchParams: { status?: string; module?: string } }) {
  const { profile } = await requireMember();
  const [modules, cases, people] = await Promise.all([
    q<Module>('select * from modules order by sort_order, name'),
    q<TestCase>('select * from test_cases order by sort_order, case_code'),
    q<Profile>(`select ${USER_COLS} from users where email_verified_at is not null order by full_name`),
  ]);

  return (
    <TestList
      modules={modules}
      initialCases={cases}
      people={people}
      me={profile}
      initialStatus={searchParams.status ?? ''}
      initialModule={searchParams.module ?? ''}
    />
  );
}
