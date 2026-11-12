import { notFound } from 'next/navigation';
import { requireManager } from '@/lib/auth';
import { q, q1 } from '@/lib/db';
import TestCaseForm from '@/components/TestCaseForm';
import type { Module, TestCase } from '@/lib/types';

export default async function EditTestPage({ params }: { params: { id: string } }) {
  await requireManager();
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const [modules, tc] = await Promise.all([
    q<Module>('select * from modules order by sort_order, name'),
    q1<TestCase>('select * from test_cases where id = $1', [params.id]),
  ]);
  if (!tc) notFound();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Edit {tc.case_code}</h1>
      <TestCaseForm modules={modules} existing={tc} />
    </div>
  );
}
