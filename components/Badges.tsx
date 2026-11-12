import { priorityColor, statusMeta } from '@/lib/constants';

export function StatusBadge({ status }: { status: string }) {
  const m = statusMeta(status);
  return <span className={`pill ${m.color}`}>{m.label}</span>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  return <span className={`pill ${priorityColor(priority)}`}>{priority}</span>;
}

/** Stacked horizontal bar of status counts. */
export function StatusBar({ counts, total }: { counts: Record<string, number>; total: number }) {
  const order = ['passed', 'failed', 'blocked', 'in_progress', 'skipped', 'not_started'];
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
      {total > 0 &&
        order.map((s) =>
          counts[s] ? (
            <div key={s} className={statusMeta(s).bar} style={{ width: `${(counts[s] / total) * 100}%` }} title={`${statusMeta(s).label}: ${counts[s]}`} />
          ) : null,
        )}
    </div>
  );
}
