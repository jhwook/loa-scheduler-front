'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { UserMenu } from '@/components/features/auth/UserMenu';
import { LostarkApiKeyRegisterButton } from '@/components/features/expedition/LostarkApiKeyRegisterButton';
import { getMe } from '@/lib/api/users';

function navActive(pathname: string, href: string) {
  if (href === '/admin') {
    return pathname === '/admin' || pathname.startsWith('/admin/');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isAdminRole(role: string | undefined): boolean {
  if (!role) return false;
  return role.trim().toUpperCase().includes('ADMIN');
}

type NavItem = { href: string; label: string; bold?: boolean };

const baseLinks: NavItem[] = [
  { href: '/expedition', label: '원정대' },
  { href: '/party', label: '공격대', bold: true },
];

function NavLinks({
  pathname,
  links,
  onNavigate,
  className,
}: {
  pathname: string;
  links: NavItem[];
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <ul className={className} role="list">
      {links.map((item) => {
        const active = navActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={
                active
                  ? 'active bg-base-300 px-4 py-2 font-semibold text-base-content'
                  : 'px-4 py-2 text-base-content/85'
              }
            >
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
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  useEffect(() => {
    let alive = true;
    async function loadAdminAccess() {
      try {
        const me = await getMe();
        if (!alive) return;
        const allowed =
          me.isAdmin === true ||
          me.user?.isAdmin === true ||
          isAdminRole(me.role) ||
          isAdminRole(me.user?.role) ||
          (Array.isArray(me.roles) && me.roles.some((r) => isAdminRole(r))) ||
          (Array.isArray(me.user?.roles) &&
            me.user.roles.some((r) => isAdminRole(r)));
        setShowAdminMenu(allowed);
      } catch {
        if (!alive) return;
        setShowAdminMenu(false);
      }
    }
    void loadAdminAccess();
    return () => {
      alive = false;
    };
  }, []);

  const links = useMemo<NavItem[]>(
    () =>
      showAdminMenu
        ? [...baseLinks, { href: '/admin', label: '관리자' }]
        : baseLinks,
    [showAdminMenu],
  );

  if (authPage) {
    return (
      <header className="sticky top-0 z-40 border-b border-base-300 bg-base-200/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4 md:px-8">
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
              links={links}
              className="menu dropdown-content z-50 mt-2 w-64 rounded-box border border-base-300 bg-base-200 p-2 text-base shadow-lg"
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

          <nav aria-label="주 메뉴" className="ml-2 hidden lg:block">
            <NavLinks
              pathname={pathname}
              links={links}
              className="menu menu-horizontal gap-1 rounded-xl bg-transparent px-1 text-base"
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
