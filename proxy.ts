import { NextRequest, NextResponse } from 'next/server';

import { SSO_SESSION_COOKIE } from '@/app/lib/sso-config';
import { verifySsoAccessToken } from '@/app/lib/sso-server';

const PUBLIC_PATH_PREFIXES = [
  '/_next',
  '/favicon.ico',
  '/silent-check-sso.html',
  '/api/auth/session',
  '/api/auth/logout',
  '/api/sso/config',
  '/api/internal/scheduled-blasts/run-due',
  '/api/v1/messages/whatsapp',
  '/sso/login',
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  return /\.[a-zA-Z0-9]+$/.test(pathname);
}

export async function proxy(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_DISABLE_SSO === 'true') {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SSO_SESSION_COOKIE)?.value;

  if (!token) {
    const loginUrl = new URL('/sso/login', request.url);
    loginUrl.searchParams.set('returnTo', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await verifySsoAccessToken(token);
    return NextResponse.next();
  } catch {
    const loginUrl = new URL('/sso/login', request.url);
    loginUrl.searchParams.set('returnTo', `${pathname}${search}`);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SSO_SESSION_COOKIE);
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
