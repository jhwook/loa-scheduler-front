"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href) => {
    if (href === "/dashboard") {
      return pathname === "/" || pathname.startsWith("/dashboard");
    }
    return pathname.startsWith(href);
  };

  const itemBaseClasses =
    "w-full gap-4 rounded-lg px-5 py-2.5 text-sm transition-colors";

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white/80 px-5 py-6 shadow-sm lg:flex lg:flex-col">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-xs font-semibold text-white">
          LoA
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight">
            LoA Scheduler
          </span>
          <span className="text-xs text-slate-500">게임 정보 · 커뮤니티</span>
        </div>
      </div>

      <nav className="flex-1 text-sm font-medium">
        <p className="menu-title text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          메인
        </p>
        <ul className="menu w-full bg-transparent p-0 text-sm">
          <li>
            <Link
              href="/dashboard"
              className={
                itemBaseClasses +
                " rounded-xl " +
                (isActive("/dashboard")
                  ? "active bg-slate-800/95 text-slate-50 px-6"
                  : "text-slate-700 hover:bg-slate-100")
              }
            >
              <div className="avatar">
                <div className="h-9 w-9 rounded-2xl bg-slate-900 p-[3px]">
                  <div className="flex h-full w-full items-end justify-between rounded-xl bg-slate-950 px-[3px] pb-[3px]">
                    <span className="h-3 w-1.5 rounded-sm bg-sky-400" />
                    <span className="h-4 w-1.5 rounded-sm bg-emerald-400" />
                    <span className="h-5 w-1.5 rounded-sm bg-fuchsia-400" />
                  </div>
                </div>
              </div>
              <span className="text-[15px]">대시보드</span>
            </Link>
          </li>
          <li>
            <Link
              href="/raidschedule"
              className={
                itemBaseClasses +
                (isActive("/raidschedule")
                  ? " active bg-slate-800/95 text-slate-50"
                  : " text-slate-700 hover:bg-slate-100")
              }
            >
              <div className="avatar placeholder">
                <div className="h-9 w-9 rounded-lg bg-slate-100 text-sm">
                  📅
                </div>
              </div>
              <span>레이드 일정</span>
            </Link>
          </li>
        </ul>

        <p className="menu-title mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          계정
        </p>
        <ul className="menu w-full bg-transparent p-0 text-sm">
          <li>
            <Link
              href="/characters"
              className={
                itemBaseClasses +
                (isActive("/characters")
                  ? " active bg-slate-800/95 text-slate-50"
                  : " text-slate-700 hover:bg-slate-100")
              }
            >
              <div className="avatar placeholder">
                <div className="h-9 w-9 rounded-full bg-slate-100 text-sm">
                  👥
                </div>
              </div>
              <span>원정대</span>
            </Link>
          </li>
        </ul>
      </nav>

      <div className="mt-6 rounded-xl bg-slate-900/95 p-4 text-xs text-slate-100">
        <p className="font-semibold">베타 버전</p>
        <p className="mt-1 text-[11px] text-slate-300">
          현재는 UI 뼈대만 구성된 상태입니다.
          <br />
          메인 콘텐츠는 나중에 자유롭게 채워 넣을 수 있어요.
        </p>
      </div>
    </aside>
  );
}

