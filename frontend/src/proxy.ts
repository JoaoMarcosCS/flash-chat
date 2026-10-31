import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/modules/auth/session/session-cookie';

const PUBLIC_ROUTES = ['/login', '/register'];
const HOME_ROUTE = '/chats';

export function proxy(request: NextRequest) {
  const isPublicRoute = PUBLIC_ROUTES.includes(request.nextUrl.pathname);
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (!hasSession && !isPublicRoute) return NextResponse.redirect(new URL('/login', request.url));
  if (hasSession && isPublicRoute) return NextResponse.redirect(new URL(HOME_ROUTE, request.url));

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
