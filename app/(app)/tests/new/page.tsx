import { requireManager } from '@/lib/auth';
import { q } from '@/lib/db';
import TestCaseForm from '@/components/TestCaseForm';
import type { Module } from '@/lib/types';

export default async function NewTestPage() {
  await requireManager();
  const modules = await q<Module>('select * from modules order by sort_order, name');
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">New test case</h1>
      <TestCaseForm modules={modules} />
    </div>
  );
}
