import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allowed public paths (Adjust the names if your pages are named differently)
  const isPublicPath = 
    pathname.startsWith('/home') || 
    pathname.startsWith('/auth') || 
    pathname === '/';

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check for our auth token cookie set by the SSO mock login
  const token = request.cookies.get('access_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};