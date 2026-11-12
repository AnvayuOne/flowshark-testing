import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, readSession } from '@/lib/session';

// First line of defence only: every page and action re-checks the user in the database.
const PUBLIC_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'));
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = path === '/' ? '' : `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }
  // (No "already signed in → leave /login" redirect here: a stale cookie would loop.
  //  The cookie is only trusted after the DB check in getCurrentUser().)
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
