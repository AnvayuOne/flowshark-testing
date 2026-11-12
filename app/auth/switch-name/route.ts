import { NextResponse, type NextRequest } from 'next/server';
import { IDENTITY_COOKIE } from '@/lib/session';

export async function POST(request: NextRequest) {
  // Only accept same-origin form posts.
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) return new NextResponse('Forbidden', { status: 403 });
  const res = NextResponse.redirect(`${request.nextUrl.origin}/`, { status: 303 });
  res.cookies.delete(IDENTITY_COOKIE);
  return res;
}
