import { PRIORITY_META, statusMeta } from '@/lib/constants';

type IconName = 'circle' | 'clock' | 'check' | 'x' | 'ban' | 'skip' | 'up' | 'minus' | 'down';

const ICON_PATHS: Record<IconName, React.ReactNode> = {
  circle: <circle cx="8" cy="8" r="4.5" />,
  clock: <><circle cx="8" cy="8" r="6" /><path d="M8 4.5V8l2.5 1.5" /></>,
  check: <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />,
  x: <path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5" />,
  ban: <><circle cx="8" cy="8" r="6" /><path d="M4 4l8 8" /></>,
  skip: <><path d="M4 4v8l6-4z" /><path d="M11 4v8" /></>,
  up: <path d="M8 3.5 12.5 10h-9z" />,
  minus: <path d="M3.5 8h9" />,
  down: <path d="M8 12.5 3.5 6h9z" />,
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  const filled = name === 'skip' || name === 'up' || name === 'down';
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const m = statusMeta(status);
  return (
    <span className={`pill ${m.color}`}>
      <Icon name={m.icon} className="h-3 w-3" />
      {m.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const m = PRIORITY_META[priority as keyof typeof PRIORITY_META] ?? PRIORITY_META.Medium;
  return (
    <span className={`pill ${m.color}`}>
      <Icon name={m.icon} className="h-2.5 w-2.5" />
      {priority}
    </span>
  );
}

/** Stacked horizontal bar of status counts. */
export function StatusBar({ counts, total }: { counts: Record<string, number>; total: number }) {
  const order = ['passed', 'failed', 'blocked', 'in_progress', 'skipped', 'not_started'];
  return (
    <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100">
      {total > 0 &&
        order.map((s) =>
          counts[s] ? (
            <div key={s} className={`rounded-full ${statusMeta(s).bar}`} style={{ width: `${(counts[s] / total) * 100}%` }} title={`${statusMeta(s).label}: ${counts[s]}`} />
          ) : null,
        )}
    </div>
  );
}
