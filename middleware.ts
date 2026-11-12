import { NextResponse, type NextRequest } from 'next/server';

// TEMP: login is disabled (see lib/auth.ts) — every request is let through.
export async function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
