"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getMe } from "@/lib/api/users";
import { getAccessToken } from "@/lib/auth/storage";

type Props = {
  children: React.ReactNode;
};

function isAdminRole(role: string | undefined): boolean {
  if (!role) return false;
  const normalized = role.trim().toUpperCase();
  return normalized.includes("ADMIN");
}

function hasAdminAccess(me: Awaited<ReturnType<typeof getMe>>): boolean {
  if (me.isAdmin === true || me.user?.isAdmin === true) return true;
  if (isAdminRole(me.role) || isAdminRole(me.user?.role)) return true;
  if (Array.isArray(me.roles) && me.roles.some((r) => isAdminRole(r))) return true;
  if (Array.isArray(me.user?.roles) && me.user.roles.some((r) => isAdminRole(r))) {
    return true;
  }
  return false;
}

export function RequireAdmin({ children }: Props) {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "allowed" | "forbidden">(
    "checking",
  );

  useEffect(() => {
    let alive = true;

    async function check() {
      if (!getAccessToken()) {
        router.replace("/login");
        return;
      }

      try {
        const me = await getMe();
        if (!alive) return;
        setState(hasAdminAccess(me) ? "allowed" : "forbidden");
      } catch {
        if (!alive) return;
        router.replace("/login");
      }
    }

    check();
    return () => {
      alive = false;
    };
  }, [router]);

  if (state === "checking") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-base-content/60">
        관리자 권한 확인 중…
      </div>
    );
  }

  if (state === "forbidden") {
    return (
      <div className="alert alert-error">
        <span>관리자 권한이 없어 접근할 수 없습니다.</span>
      </div>
    );
  }

  return <>{children}</>;
}
