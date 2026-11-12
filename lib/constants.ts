export const ALLOWED_DOMAIN = 'anvayuone.com';

export function isCompanyEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith('@' + ALLOWED_DOMAIN);
}

/** The part before "@" — used as the account's username/display name. */
export const usernameFromEmail = (email: string) => email.trim().toLowerCase().split('@')[0] || email;

export const STATUSES = [
  { value: 'not_started', label: 'Not Started', color: 'bg-slate-100 text-slate-700 ring-slate-300', bar: 'bg-slate-300', solid: 'bg-slate-400', border: 'border-slate-300', chip: 'bg-slate-100 text-slate-500', icon: 'circle' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-amber-100 text-amber-800 ring-amber-300', bar: 'bg-amber-400', solid: 'bg-amber-500', border: 'border-amber-400', chip: 'bg-amber-50 text-amber-600', icon: 'clock' },
  { value: 'passed', label: 'Passed', color: 'bg-emerald-100 text-emerald-800 ring-emerald-300', bar: 'bg-emerald-500', solid: 'bg-emerald-500', border: 'border-emerald-500', chip: 'bg-emerald-50 text-emerald-600', icon: 'check' },
  { value: 'failed', label: 'Failed', color: 'bg-red-100 text-red-800 ring-red-300', bar: 'bg-red-500', solid: 'bg-red-500', border: 'border-red-500', chip: 'bg-red-50 text-red-600', icon: 'x' },
  { value: 'blocked', label: 'Blocked', color: 'bg-purple-100 text-purple-800 ring-purple-300', bar: 'bg-purple-500', solid: 'bg-purple-500', border: 'border-purple-500', chip: 'bg-purple-50 text-purple-600', icon: 'ban' },
  { value: 'skipped', label: 'Skipped', color: 'bg-zinc-100 text-zinc-600 ring-zinc-300', bar: 'bg-zinc-400', solid: 'bg-zinc-400', border: 'border-zinc-300', chip: 'bg-zinc-100 text-zinc-500', icon: 'skip' },
] as const;

export type Status = (typeof STATUSES)[number]['value'];

export const statusMeta = (s: string) => STATUSES.find((x) => x.value === s) ?? STATUSES[0];

export const PRIORITIES = ['High', 'Medium', 'Low'] as const;

export const PRIORITY_META: Record<(typeof PRIORITIES)[number], { color: string; icon: 'up' | 'minus' | 'down' }> = {
  High: { color: 'text-red-700 bg-red-50 ring-red-200', icon: 'up' },
  Medium: { color: 'text-amber-700 bg-amber-50 ring-amber-200', icon: 'minus' },
  Low: { color: 'text-slate-600 bg-slate-50 ring-slate-200', icon: 'down' },
};

/** Fixed, repeating accent order for module landmarks — never reassigned by filtering.
 *  Kept clear of the red family so a module dot is never mistaken for the "failed" status color. */
export const MODULE_ACCENTS = [
  'bg-blue-500', 'bg-orange-500', 'bg-teal-500', 'bg-amber-500',
  'bg-cyan-500', 'bg-green-600', 'bg-violet-500', 'bg-indigo-500',
] as const;
export const moduleAccent = (i: number) => MODULE_ACCENTS[i % MODULE_ACCENTS.length];
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

/** Only allow same-site relative redirects (prevents open-redirects). */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/';
  return next;
}
