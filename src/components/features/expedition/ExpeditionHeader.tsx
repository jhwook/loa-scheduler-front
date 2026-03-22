"use client";

import { LostarkApiKeyRegisterButton } from "@/components/features/expedition/LostarkApiKeyRegisterButton";

export function ExpeditionHeader() {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur md:px-6">
      <div className="min-w-0 flex-1 flex flex-col">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Account</span>
          <span>/</span>
          <span className="text-slate-600">원정대</span>
        </div>
        <h1 className="text-base font-semibold tracking-tight text-slate-900 md:text-lg">
          원정대
        </h1>
      </div>

      <div className="shrink-0">
        <LostarkApiKeyRegisterButton />
      </div>
    </header>
  );
}
