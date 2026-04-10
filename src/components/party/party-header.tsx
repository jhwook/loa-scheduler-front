"use client";

import { UserMenu } from "@/components/features/auth/UserMenu";

export function PartyHeader() {
  return (
    <header className="relative z-200 flex h-16 items-center justify-between gap-4 border-b border-base-300 bg-base-200/90 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 text-xs text-base-content/50">
          <span>Account</span>
          <span>/</span>
          <span className="text-base-content/70">공격대</span>
        </div>
        <h1 className="text-base font-semibold tracking-tight text-base-content md:text-lg">
          공격대
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <UserMenu />
      </div>
    </header>
  );
}
