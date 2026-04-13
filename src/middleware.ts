import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/** 레이아웃·RSC와 충돌하지 않도록 /admin 진입은 여기서만 리다이렉트 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/admin') {
    return NextResponse.redirect(new URL('/admin/raids', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin'],
};
