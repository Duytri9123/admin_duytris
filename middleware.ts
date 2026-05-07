// middleware.ts - Admin Panel route protection
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard'];
const GUEST_ONLY_ROUTES = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect root "/" về dashboard hoặc login
  if (pathname === '/') {
    const authCookie = request.cookies.get('auth_user');
    const adminCookie = request.cookies.get('is_admin');
    const isAuthenticated = !!authCookie?.value;
    const isAdmin = !!adminCookie?.value;
    if (isAuthenticated && isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Bỏ qua static files và api routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get('auth_user');
  const adminCookie = request.cookies.get('is_admin');
  const isAuthenticated = !!authCookie?.value;
  const isAdmin = !!adminCookie?.value;

  // Bảo vệ dashboard routes
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isAuthenticated || !isAdmin) {
      const url = new URL('/login', request.url);
      // Tránh redirect loop: nếu đã ở /login rồi thì không redirect nữa
      if (pathname !== '/login') {
        return NextResponse.redirect(url);
      }
    }
  }

  // Redirect admin đã login ra khỏi trang login
  if (GUEST_ONLY_ROUTES.includes(pathname) && isAuthenticated && isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/login'],
};
