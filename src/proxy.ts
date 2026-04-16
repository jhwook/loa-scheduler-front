import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/** /admin 진입 시 즉시 /admin/raids로 보냄 */
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/admin') {
    return NextResponse.redirect(new URL('/admin/raids', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin'],
};
