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
    <nav className="flex gap-1">
      {links.map((l) => {
        const active = l.href === '/' ? path === '/' : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
