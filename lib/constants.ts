export const ALLOWED_DOMAIN = 'anvayuone.com';

export function isCompanyEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith('@' + ALLOWED_DOMAIN);
}

export const STATUSES = [
  { value: 'not_started', label: 'Not Started', color: 'bg-slate-100 text-slate-700 ring-slate-300', bar: 'bg-slate-300' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-amber-100 text-amber-800 ring-amber-300', bar: 'bg-amber-400' },
  { value: 'passed', label: 'Passed', color: 'bg-emerald-100 text-emerald-800 ring-emerald-300', bar: 'bg-emerald-500' },
  { value: 'failed', label: 'Failed', color: 'bg-red-100 text-red-800 ring-red-300', bar: 'bg-red-500' },
  { value: 'blocked', label: 'Blocked', color: 'bg-purple-100 text-purple-800 ring-purple-300', bar: 'bg-purple-500' },
  { value: 'skipped', label: 'Skipped', color: 'bg-zinc-100 text-zinc-600 ring-zinc-300', bar: 'bg-zinc-400' },
] as const;

export type Status = (typeof STATUSES)[number]['value'];

export const statusMeta = (s: string) => STATUSES.find((x) => x.value === s) ?? STATUSES[0];

export const PRIORITIES = ['High', 'Medium', 'Low'] as const;
export const CATEGORIES = [
  'Functional',
  'Validation',
  'UI',
  'Navigation',
  'Negative',
  'Security',
  'End-to-End',
  'Data Accuracy',
  'AI Behaviour',
] as const;
export const ROLES = ['admin', 'lead', 'tester', 'developer'] as const;
export type Role = (typeof ROLES)[number];

export const priorityColor = (p: string) =>
  p === 'High'
    ? 'text-red-700 bg-red-50 ring-red-200'
    : p === 'Low'
      ? 'text-slate-600 bg-slate-50 ring-slate-200'
      : 'text-amber-700 bg-amber-50 ring-amber-200';

/** Only allow same-site relative redirects (prevents open-redirects). */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/';
  return next;
}
