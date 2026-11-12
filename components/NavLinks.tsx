'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLinks({ isManager }: { isManager: boolean }) {
  const path = usePathname();
  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/tests', label: 'Test Cases' },
    ...(isManager ? [{ href: '/admin', label: 'Manage' }] : []),
  ];
  return (
    <nav className="flex gap-1 rounded-lg bg-slate-100 p-1">
      {links.map((l) => {
        const active = l.href === '/' ? path === '/' : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${active ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
