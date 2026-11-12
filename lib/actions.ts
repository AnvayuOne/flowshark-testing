'use server';

// Every action re-checks the signed-in user and their role on the server.
import { q, q1, tx } from '@/lib/db';
import { getCurrentUser, isManagerRole } from '@/lib/auth';
import { CATEGORIES, PRIORITIES, ROLES, STATUSES } from '@/lib/constants';
import type { Note, Profile } from '@/lib/types';

type R<T = object> = ({ ok: true } & T) | { ok?: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID.test(v);
const str = (v: unknown, max: number) => {
  const s = String(v ?? '').trim();
  return s ? s.slice(0, max) : null;
};

async function me(): Promise<Profile> {
  const u = await getCurrentUser();
  if (!u) throw new Error('Your session has expired. Please sign in again.');
  return u;
}

function fail(e: unknown): { error: string } {
  const err = e as { code?: string; message?: string };
  if (err?.code === '23505') return { error: 'That ID or code already exists.' };
  return { error: err?.message?.startsWith('Your session') ? err.message : 'Could not save. Please try again.' };
}

// ------------------------------------------------------------- status / assignee
export async function updateTestCase(id: string, patch: { status?: string; assigned_to?: string | null }): Promise<R> {
  try {
    const user = await me();
    if (!isUuid(id)) return { error: 'Invalid test case.' };
    if (patch.status !== undefined && !STATUSES.some((s) => s.value === patch.status)) return { error: 'Invalid status.' };
    if (patch.assigned_to !== undefined && patch.assigned_to !== null && !isUuid(patch.assigned_to)) return { error: 'Invalid assignee.' };

    return await tx(async (c) => {
      const cur = (await c.query<{ status: string }>('select status from test_cases where id = $1 for update', [id])).rows[0];
      if (!cur) return { error: 'Test case not found.' };
      if (patch.assigned_to) {
        const ok = (await c.query('select 1 from users where id = $1 and email_verified_at is not null', [patch.assigned_to])).rowCount;
        if (!ok) return { error: 'That person is not a member.' };
      }
      const status = patch.status ?? cur.status;
      await c.query(
        `update test_cases set status = $2,
           assigned_to = case when $3::boolean then $4::uuid else assigned_to end,
           updated_by = $5, updated_at = now()
         where id = $1`,
        [id, status, patch.assigned_to !== undefined, patch.assigned_to ?? null, user.id],
      );
      if (status !== cur.status) {
        await c.query('insert into status_history (test_case_id, old_status, new_status, changed_by) values ($1, $2, $3, $4)', [
          id, cur.status, status, user.id,
        ]);
      }
      return { ok: true as const };
    });
  } catch (e) {
    return fail(e);
  }
}

// ------------------------------------------------------------- notes
export async function getNotes(testCaseId: string): Promise<R<{ notes: Note[] }>> {
  try {
    await me();
    if (!isUuid(testCaseId)) return { error: 'Invalid test case.' };
    const notes = await q<Note>('select * from test_notes where test_case_id = $1 order by created_at', [testCaseId]);
    return { ok: true, notes };
  } catch (e) {
    return fail(e);
  }
}

export async function addNote(testCaseId: string, body: string): Promise<R<{ note: Note }>> {
  try {
    const user = await me();
    const text = String(body ?? '').trim();
    if (!isUuid(testCaseId)) return { error: 'Invalid test case.' };
    if (!text || text.length > 5000) return { error: 'Notes must be 1–5000 characters.' };
    const note = await q1<Note>('insert into test_notes (test_case_id, author_id, body) values ($1, $2, $3) returning *', [testCaseId, user.id, text]);
    return { ok: true, note: note! };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteNote(noteId: string): Promise<R> {
  try {
    const user = await me();
    if (!isUuid(noteId)) return { error: 'Invalid note.' };
    const rows = await q('delete from test_notes where id = $1 and (author_id = $2 or $3) returning id', [noteId, user.id, user.role === 'admin']);
    return rows.length ? { ok: true } : { error: 'You can only delete your own notes.' };
  } catch (e) {
    return fail(e);
  }
}

// ------------------------------------------------------------- test cases (leads / admins)
export type TestCaseInput = {
  case_code: string;
  module_id: string;
  title: string;
  category: string;
  priority: string;
  preconditions: string | null;
  steps: string[];
  expected_result: string | null;
  test_data: string | null;
};

export async function saveTestCase(id: string | null, input: TestCaseInput): Promise<R<{ id: string }>> {
  try {
    const user = await me();
    if (!isManagerRole(user.role)) return { error: 'Only admins and leads can edit test cases.' };
    const v = {
      case_code: str(input.case_code, 40)?.toUpperCase(),
      module_id: input.module_id,
      title: str(input.title, 300),
      category: input.category,
      priority: input.priority,
      preconditions: str(input.preconditions, 4000),
      steps: (Array.isArray(input.steps) ? input.steps : []).map((s) => String(s).trim().slice(0, 1000)).filter(Boolean).slice(0, 100),
      expected_result: str(input.expected_result, 4000),
      test_data: str(input.test_data, 4000),
    };
    if (!v.case_code || !v.title || !isUuid(v.module_id)) return { error: 'ID, module and title are required.' };
    if (!(CATEGORIES as readonly string[]).includes(v.category)) return { error: 'Invalid type.' };
    if (!(PRIORITIES as readonly string[]).includes(v.priority)) return { error: 'Invalid priority.' };
    if (v.steps.length === 0) return { error: 'Add at least one step.' };

    const params = [v.case_code, v.module_id, v.title, v.category, v.priority, v.preconditions, JSON.stringify(v.steps), v.expected_result, v.test_data];
    const row = id
      ? isUuid(id)
        ? await q1<{ id: string }>(
            `update test_cases set case_code=$1, module_id=$2, title=$3, category=$4, priority=$5, preconditions=$6,
               steps=$7::jsonb, expected_result=$8, test_data=$9 where id=$10 returning id`,
            [...params, id],
          )
        : null
      : await q1<{ id: string }>(
          `insert into test_cases (case_code, module_id, title, category, priority, preconditions, steps, expected_result, test_data, created_by, sort_order)
           values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10, coalesce((select max(sort_order)+1 from test_cases where module_id=$2),1)) returning id`,
          [...params, user.id],
        );
    return row ? { ok: true, id: row.id } : { error: 'Test case not found.' };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteTestCase(id: string): Promise<R> {
  try {
    const user = await me();
    if (!isManagerRole(user.role)) return { error: 'Only admins and leads can delete test cases.' };
    if (!isUuid(id)) return { error: 'Invalid test case.' };
    await q('delete from test_cases where id = $1', [id]);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ------------------------------------------------------------- modules
export async function addModule(input: { code: string; name: string; description?: string }): Promise<R> {
  try {
    const user = await me();
    if (!isManagerRole(user.role)) return { error: 'Only admins and leads can manage modules.' };
    const code = str(input.code, 20)?.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const name = str(input.name, 120);
    if (!code || !name) return { error: 'Module code and name are required.' };
    await q(`insert into modules (code, name, description, sort_order) values ($1, $2, $3, coalesce((select max(sort_order)+1 from modules), 1))`, [
      code, name, str(input.description, 500),
    ]);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateModule(id: string, patch: { name?: string; sort_order?: number }): Promise<R> {
  try {
    const user = await me();
    if (!isManagerRole(user.role)) return { error: 'Only admins and leads can manage modules.' };
    if (!isUuid(id)) return { error: 'Invalid module.' };
    const name = patch.name !== undefined ? str(patch.name, 120) : undefined;
    if (name === null) return { error: 'Name cannot be empty.' };
    const order = patch.sort_order !== undefined ? Math.trunc(Number(patch.sort_order)) : undefined;
    if (order !== undefined && !Number.isFinite(order)) return { error: 'Invalid order.' };
    await q('update modules set name = coalesce($2, name), sort_order = coalesce($3, sort_order) where id = $1', [id, name ?? null, order ?? null]);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteModule(id: string): Promise<R> {
  try {
    const user = await me();
    if (!isManagerRole(user.role)) return { error: 'Only admins and leads can manage modules.' };
    if (!isUuid(id)) return { error: 'Invalid module.' };
    await q('delete from modules where id = $1', [id]);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ------------------------------------------------------------- roles (admins)
export async function setUserRole(userId: string, role: string): Promise<R> {
  try {
    const user = await me();
    if (user.role !== 'admin') return { error: 'Only admins can change roles.' };
    if (!isUuid(userId) || !(ROLES as readonly string[]).includes(role)) return { error: 'Invalid request.' };
    return await tx(async (c) => {
      await c.query('lock table users in share row exclusive mode');
      const target = (await c.query<{ role: string }>('select role from users where id = $1', [userId])).rows[0];
      if (!target) return { error: 'User not found.' };
      if (target.role === 'admin' && role !== 'admin') {
        const n = (await c.query<{ n: number }>(`select count(*)::int n from users where role = 'admin' and email_verified_at is not null`)).rows[0].n;
        if (n <= 1) return { error: 'There must be at least one admin.' };
      }
      await c.query('update users set role = $2 where id = $1', [userId, role]);
      return { ok: true as const };
    });
  } catch (e) {
    return fail(e);
  }
}
