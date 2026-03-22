"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { signupApi } from "@/lib/api/auth";
import { ApiError } from "@/types/api";

const MAX_LEN = 20;

export function SignupForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const id = username.trim();
    const pw = password;
    const pw2 = passwordConfirm;

    if (id.length === 0 || id.length > MAX_LEN) {
      setError(`아이디는 1~${MAX_LEN}자로 입력해 주세요.`);
      return;
    }
    if (pw.length === 0 || pw.length > MAX_LEN) {
      setError(`비밀번호는 1~${MAX_LEN}자로 입력해 주세요.`);
      return;
    }
    if (pw2.length === 0 || pw2.length > MAX_LEN) {
      setError(`비밀번호 확인은 1~${MAX_LEN}자로 입력해 주세요.`);
      return;
    }
    if (pw !== pw2) {
      setError("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setPending(true);
    try {
      await signupApi({ username: id, password: pw });
      router.replace("/login");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("회원가입에 실패했습니다.");
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
        <h1 className="text-lg font-semibold text-slate-900">회원가입</h1>
        <p className="text-xs text-slate-500">
          아이디와 비밀번호를 입력한 뒤 가입을 완료하세요.
        </p>
      </div>

      <div className="flex w-full flex-col gap-1.5">
        <label
          htmlFor="signup-username"
          className="text-xs font-medium text-slate-600"
        >
          아이디
        </label>
        <input
          id="signup-username"
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
          htmlFor="signup-password"
          className="text-xs font-medium text-slate-600"
        >
          비밀번호
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
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

      <div className="flex w-full flex-col gap-1.5">
        <label
          htmlFor="signup-password-confirm"
          className="text-xs font-medium text-slate-600"
        >
          비밀번호 확인
        </label>
        <input
          id="signup-password-confirm"
          type="password"
          autoComplete="new-password"
          required
          maxLength={MAX_LEN}
          value={passwordConfirm}
          onChange={(e) =>
            setPasswordConfirm(e.target.value.slice(0, MAX_LEN))
          }
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
          {pending ? "가입 중…" : "가입하기"}
        </button>
        <Link
          href="/login"
          className="btn btn-outline flex-1 rounded-xl border-slate-300"
        >
          로그인으로
        </Link>
      </div>
    </form>
  );
}
