import type { Role, Status } from './constants';

export type Profile = { id: string; email: string; full_name: string | null; role: Role; created_at: string };

export type Module = { id: string; code: string; name: string; description: string | null; sort_order: number };

export type TestCase = {
  id: string;
  case_code: string;
  module_id: string;
  title: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  preconditions: string | null;
  steps: string[];
  expected_result: string | null;
  test_data: string | null;
  status: Status;
  assigned_to: string | null;
  updated_by: string | null;
  updated_at: string | null;
  created_at: string;
  sort_order: number;
};

export type Note = { id: string; test_case_id: string; author_id: string; body: string; created_at: string };

export type HistoryRow = {
  id: number;
  test_case_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string | null;
  changed_at: string;
};

export const displayName = (p?: Pick<Profile, 'full_name' | 'email'> | null) =>
  p ? p.full_name || p.email.split('@')[0] : 'Unknown';

export const fmtDate = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—';
