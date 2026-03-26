"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { loginApi } from "@/lib/api/auth";
import {
  getAccessToken,
  setAccessToken,
  setHasApiToken,
  setLostarkApiToken,
} from "@/lib/auth/storage";
import { ApiError } from "@/types/api";

const MAX_LEN = 20;

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (getAccessToken()) {
      router.replace("/expedition");
    }
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const id = username.trim();
    const pw = password;
    if (id.length === 0 || id.length > MAX_LEN) {
      setError(`아이디는 1~${MAX_LEN}자로 입력해 주세요.`);
      return;
    }
    if (pw.length === 0 || pw.length > MAX_LEN) {
      setError(`비밀번호는 1~${MAX_LEN}자로 입력해 주세요.`);
      return;
    }

    setPending(true);
    try {
      const { accessToken, hasApiToken, lostarkApiToken } = await loginApi({
        username: id,
        password: pw,
      });
      setAccessToken(accessToken);
      setHasApiToken(hasApiToken);
      setLostarkApiToken(lostarkApiToken ?? null);
      router.replace("/expedition");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("로그인에 실패했습니다.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-slate-900">로그인</h1>
        <p className="text-xs text-slate-500">
          계정으로 로그인하면 원정대 설정으로 이동합니다.
        </p>
      </div>

      <div className="flex w-full flex-col gap-1.5">
        <label
          htmlFor="login-username"
          className="text-xs font-medium text-slate-600"
        >
          아이디
        </label>
        <input
          id="login-username"
          type="text"
          name="username"
          autoComplete="username"
          required
          maxLength={MAX_LEN}
          value={username}
          onChange={(e) => setUsername(e.target.value.slice(0, MAX_LEN))}
          className="input input-bordered w-full border-slate-200 bg-white text-sm"
        />
        <p className="text-[11px] leading-relaxed text-slate-400">
          최대 {MAX_LEN}자
        </p>
      </div>

      <div className="flex w-full flex-col gap-1.5">
        <label
          htmlFor="login-password"
          className="text-xs font-medium text-slate-600"
        >
          비밀번호
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={MAX_LEN}
          value={password}
          onChange={(e) => setPassword(e.target.value.slice(0, MAX_LEN))}
          className="input input-bordered w-full border-slate-200 bg-white text-sm"
        />
        <p className="text-[11px] leading-relaxed text-slate-400">
          최대 {MAX_LEN}자
        </p>
      </div>

      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={pending}
          className="btn btn-neutral flex-1 rounded-xl"
        >
          {pending ? "로그인 중…" : "로그인"}
        </button>
        <Link
          href="/signup"
          className="btn btn-outline flex-1 rounded-xl border-slate-300"
        >
          회원가입
        </Link>
      </div>
    </form>
  );
}
