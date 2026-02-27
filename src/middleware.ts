import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('firebase-auth-token')?.value;
  const role = request.cookies.get('userRole')?.value; // <-- Added role check
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');

  // Define public routes that don't need authentication
  const publicRoutes = ['/login', '/api/verify-turnstile'];
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // If no token and not on a public route, redirect to login
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If logged in and trying to access the login page
  if (token && isLoginPage) {
    if (role === 'production') {
      return NextResponse.redirect(new URL('/label-print', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If accessing the root path ('/')
  if (token && request.nextUrl.pathname === '/') {
    if (role === 'production') {
      return NextResponse.redirect(new URL('/label-print', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Restrict production user from accessing admin pages
  if (token && role === 'production') {
    const path = request.nextUrl.pathname;
    if (
      path.startsWith('/dashboard') || 
      path.startsWith('/jobs') || 
      path.startsWith('/history') || 
      path.startsWith('/sales-delivery') || 
      path.startsWith('/courier') || 
      path.startsWith('/print')
    ) {
      return NextResponse.redirect(new URL('/label-print', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico|spec-white.png).*)'],
};