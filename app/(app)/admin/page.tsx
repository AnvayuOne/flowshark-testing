import { requireManager } from '@/lib/auth';
import { USER_COLS, q } from '@/lib/db';
import AdminPanel from '@/components/AdminPanel';
import type { Module, Profile } from '@/lib/types';

export default async function AdminPage() {
  const { profile } = await requireManager();
  const [modules, people, counts] = await Promise.all([
    q<Module>('select * from modules order by sort_order, name'),
    q<Profile>(`select ${USER_COLS} from users where email_verified_at is not null order by created_at`),
    q<{ module_id: string; n: number }>('select module_id, count(*)::int n from test_cases group by module_id'),
  ]);
  const caseCounts = Object.fromEntries(counts.map((c) => [c.module_id, c.n]));
  return <AdminPanel modules={modules} people={people} me={profile} caseCounts={caseCounts} />;
}
