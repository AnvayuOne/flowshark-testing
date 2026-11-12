import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

export async function POST(request: NextRequest) {
  // Only accept same-origin form posts.
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) return new NextResponse('Forbidden', { status: 403 });
  const res = NextResponse.redirect(`${request.nextUrl.origin}/login`, { status: 303 });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
