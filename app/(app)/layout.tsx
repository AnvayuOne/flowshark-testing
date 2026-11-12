import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { displayName } from '@/lib/types';
import NavLinks from '@/components/NavLinks';
import NamePrompt from '@/components/NamePrompt';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentUser();
  if (!profile) return <NamePrompt />;
  const isManager = profile.role === 'admin' || profile.role === 'lead';

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm text-white">A</span>
            Test Tracker
          </Link>
          <NavLinks isManager={isManager} />
          <div className="ml-auto flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
              {displayName(profile).slice(0, 1).toUpperCase()}
            </div>
            <div className="text-right leading-tight">
              <div className="text-sm font-medium text-slate-800">{displayName(profile)}</div>
              <div className="text-xs capitalize text-slate-500">{profile.role}</div>
            </div>
            <form action="/auth/switch-name" method="post">
              <button className="btn-secondary px-3 py-1.5 text-xs">Not you?</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
