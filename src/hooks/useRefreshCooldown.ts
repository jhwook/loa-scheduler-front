"use client";

import { useCallback, useEffect, useReducer } from "react";

const COOLDOWN_MS = 60_000;

const KEY_ALL = "loa_scheduler_refresh_all_until";

function charKey(id: number): string {
  return `loa_scheduler_refresh_char_${id}_until`;
}

function readUntil(key: string): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(key);
  if (!raw) return 0;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}

function remainingSec(until: number): number {
  if (!until) return 0;
  return Math.max(0, Math.ceil((until - Date.now()) / 1000));
}

export function useRefreshCooldown() {
  const [, bump] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    const id = window.setInterval(() => bump(), 500);
    return () => window.clearInterval(id);
  }, []);

  const allRemainingSec = remainingSec(readUntil(KEY_ALL));

  const charRemainingSec = useCallback((characterId: number) => {
    return remainingSec(readUntil(charKey(characterId)));
  }, []);

  const startAllCooldown = useCallback(() => {
    localStorage.setItem(KEY_ALL, String(Date.now() + COOLDOWN_MS));
    bump();
  }, []);

  const startCharCooldown = useCallback((characterId: number) => {
    localStorage.setItem(charKey(characterId), String(Date.now() + COOLDOWN_MS));
    bump();
  }, []);

  return {
    allRemainingSec,
    charRemainingSec,
    startAllCooldown,
    startCharCooldown,
  };
}
