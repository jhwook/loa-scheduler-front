"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { hasAuthSession } from "@/lib/auth/storage";

type Props = {
  children: React.ReactNode;
};

/**
 * localStorage의 access 또는 refresh 토큰 기준 클라이언트 가드.
 * (httpOnly 쿠키 세션으로 바꾸면 middleware로 옮기는 것을 권장)
 */
export function RequireAuth({ children }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!hasAuthSession()) {
      router.replace("/login");
      return;
    }
    queueMicrotask(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-base-content/60">
        인증 확인 중…
      </div>
    );
  }

  return <>{children}</>;
}
