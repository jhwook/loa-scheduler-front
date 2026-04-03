"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { clearAuthStorage, getAccessToken } from "@/lib/auth/storage";

export function PartyHeader() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(getAccessToken()));
  }, []);

  function onLogout() {
    clearAuthStorage();
    setIsLoggedIn(false);
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Account</span>
          <span>/</span>
          <span className="text-slate-600">공격대</span>
        </div>
        <h1 className="text-base font-semibold tracking-tight text-slate-900 md:text-lg">
          공격대
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isLoggedIn ? (
          <button
            type="button"
            onClick={onLogout}
            className="btn btn-outline btn-sm border-slate-300 bg-white text-slate-700"
          >
            Logout
          </button>
        ) : (
          <Link href="/login" className="btn btn-neutral btn-sm">
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
