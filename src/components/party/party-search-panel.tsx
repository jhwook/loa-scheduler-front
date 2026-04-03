"use client";

import { type FormEvent, useState } from "react";

type Props = {
  className?: string;
};

/**
 * 공격대 검색 UI (목업).
 * TODO: 검색 실행 시 GET /party-groups/search?q=... 등 연동
 */
export function PartySearchPanel({ className = "" }: Props) {
  const [query, setQuery] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    // TODO: API 호출로 교체
    console.info("[party-search mock]", query.trim());
  }

  return (
    <form
      onSubmit={handleSearch}
      className={`flex flex-col gap-2 sm:flex-row sm:items-center ${className}`}
    >
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="공격대 이름으로 검색"
        className="input input-bordered w-full border-slate-600 bg-slate-900/80 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        autoComplete="off"
      />
      <button
        type="submit"
        className="btn btn-primary btn-sm shrink-0 px-5 text-slate-950"
      >
        검색
      </button>
    </form>
  );
}
