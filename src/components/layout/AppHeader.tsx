'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { UserMenu } from '@/components/features/auth/UserMenu';
import { LostarkApiKeyRegisterButton } from '@/components/features/expedition/LostarkApiKeyRegisterButton';

function navActive(pathname: string, href: string) {
  if (href === '/dashboard') {
    return pathname === '/' || pathname.startsWith('/dashboard');
  }
  if (href === '/admin') {
    return pathname === '/admin' || pathname.startsWith('/admin/');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavItem =
  | { href: string; label: string; chart: true }
  | { href: string; label: string; emoji: string; bold?: boolean };

const links: NavItem[] = [
  { href: '/dashboard', label: '대시보드', chart: true },
  { href: '/raidschedule', label: '레이드 일정', emoji: '📅' },
  { href: '/expedition', label: '원정대', emoji: '👥' },
  { href: '/party', label: '공격대', emoji: '⚔️', bold: true },
  { href: '/admin', label: '관리자', emoji: '🛠️' },
];

function NavLinks({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <ul className={className} role="list">
      {links.map((item) => {
        const active = navActive(pathname, item.href);
        const isChart = 'chart' in item && item.chart;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={
                active
                  ? 'active bg-base-300 font-medium text-base-content'
                  : 'text-base-content/85'
              }
            >
              {isChart ? (
                <div className="h-8 w-8 shrink-0 p-[2px]">
                  <div className="flex h-full w-full items-end justify-between rounded-lg bg-transparent px-[2px] pb-[2px]">
                    <span className="h-2.5 w-1 rounded-sm bg-sky-400" />
                    <span className="h-3.5 w-1 rounded-sm bg-emerald-400" />
                    <span className="h-[18px] w-1 rounded-sm bg-fuchsia-400" />
                  </div>
                </div>
              ) : (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center text-base">
                  {'emoji' in item ? item.emoji : null}
                </span>
              )}
              <span
                className={
                  'bold' in item && item.bold ? 'font-semibold' : undefined
                }
              >
                {item.label}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const showApiKey = pathname.startsWith('/expedition');
  const authPage = pathname === '/login' || pathname === '/signup';

  if (authPage) {
    return (
      <header className="sticky top-0 z-40 border-b border-base-300 bg-base-200/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4 md:px-8">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-base-content"
          >
            LoA Scheduler
          </Link>
          <span className="text-xs text-base-content/60">
            {pathname === '/login' ? '로그인' : '회원가입'}
          </span>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-base-300 bg-base-200/95 backdrop-blur supports-[backdrop-filter]:bg-base-200/85">
      <div className="navbar min-h-16 gap-2 px-2 sm:px-4">
        <div className="navbar-start min-w-0 flex-1 gap-1">
          <div className="dropdown dropdown-end lg:hidden">
            <button
              type="button"
              tabIndex={0}
              className="btn btn-ghost btn-square"
              aria-label="메뉴 열기"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <NavLinks
              pathname={pathname}
              className="menu dropdown-content menu-sm z-50 mt-2 w-56 rounded-box border border-base-300 bg-base-200 p-2 shadow-lg"
            />
          </div>

          <Link
            href="/dashboard"
            className="flex min-w-0 max-w-[min(100%,14rem)] items-center gap-2 sm:max-w-none"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-content">
              LoA
            </div>
            <div className="hidden min-w-0 flex-col sm:flex">
              <span className="truncate text-sm font-semibold tracking-tight text-base-content">
                LoA Scheduler
              </span>
            </div>
          </Link>
        </div>

        <div className="navbar-center hidden max-w-3xl flex-[2] justify-center px-2 lg:flex">
          <nav aria-label="주 메뉴">
            <NavLinks
              pathname={pathname}
              className="menu menu-horizontal menu-sm gap-0.5 rounded-xl bg-transparent px-0"
            />
          </nav>
        </div>

        <div className="navbar-end w-auto shrink-0 gap-1 sm:gap-2">
          <div
            className="tooltip tooltip-bottom hidden 2xl:inline-block"
            data-tip="현재는 UI 뼈대만 구성된 상태입니다. 메인 콘텐츠는 이후 확장할 수 있어요."
          ></div>
          {showApiKey ? <LostarkApiKeyRegisterButton /> : null}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
