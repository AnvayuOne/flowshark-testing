import Link from 'next/link';
import { requireMember } from '@/lib/auth';
import { displayName } from '@/lib/types';
import NavLinks from '@/components/NavLinks';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireMember();
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
            <div className="text-right leading-tight">
              <div className="text-sm font-medium text-slate-800">{displayName(profile)}</div>
              <div className="text-xs capitalize text-slate-500">{profile.role}</div>
            </div>
            <form action="/auth/signout" method="post">
              <button className="btn-secondary px-3 py-1.5 text-xs">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
