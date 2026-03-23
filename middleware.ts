import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/auth/callback', '/api/demo-login'];

export async function middleware(req: NextRequest) {
  const isPublic = PUBLIC_PATHS.some((path) => req.nextUrl.pathname.startsWith(path));
  const demoUserId = req.cookies.get('demo_user_id')?.value;

  if (!demoUserId && !isPublic) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  if (demoUserId && req.nextUrl.pathname === '/login') {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
