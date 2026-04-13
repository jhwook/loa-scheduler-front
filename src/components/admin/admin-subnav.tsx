'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/admin/raids', label: '레이드 관리' },
  { href: '/admin/level-range-filters', label: '레벨 범위 필터 관리' },
] as const;

export function AdminSubnav() {
  const pathname = usePathname();

  return (
    <div className="mb-6 border-b border-base-300 pb-1">
      <h1 className="mb-3 text-xl font-semibold tracking-tight text-base-content">
        관리자
      </h1>
      <nav
        className="flex flex-wrap gap-1"
        aria-label="관리자 하위 메뉴"
      >
        {tabs.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-base-300 text-base-content'
                  : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
