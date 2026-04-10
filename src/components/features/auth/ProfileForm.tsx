'use client';

import { useEffect, useState, type FormEvent } from 'react';

import { getMe, updateMyProfile } from '@/lib/api/users';
import { ApiError } from '@/types/api';

const MAX_LEN = 20;

function extractNickname(raw: Awaited<ReturnType<typeof getMe>>): string {
  return (raw.nickname ?? raw.user?.nickname ?? '').trim();
}

export function ProfileForm() {
  const [nickname, setNickname] = useState('');
  const [initialNickname, setInitialNickname] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const me = await getMe();
        const nick = extractNickname(me);
        setNickname(nick);
        setInitialNickname(nick);
      } catch (err) {
        if (err instanceof ApiError) setError(err.message);
        else if (err instanceof Error) setError(err.message);
        else setError('프로필을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(null);

    const next = nickname.trim();
    if (next.length === 0 || next.length > MAX_LEN) {
      setError(`닉네임은 1~${MAX_LEN}자로 입력해 주세요.`);
      return;
    }

    setSaving(true);
    try {
      const me = await updateMyProfile({ nickname: next });
      const savedNick = extractNickname(me) || next;
      setNickname(savedNick);
      setInitialNickname(savedNick);
      setDone('프로필이 저장되었습니다.');
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else if (err instanceof Error) setError(err.message);
      else setError('프로필 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-base-300 bg-base-200 p-6 text-sm text-base-content/60 shadow-sm">
        프로필을 불러오는 중…
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900">프로필</h2>
        <p className="text-xs text-slate-500">
          현재 닉네임: {initialNickname || '없음'}
        </p>
      </div>

      <div className="flex w-full flex-col gap-1.5">
        <label
          htmlFor="profile-nickname"
          className="text-xs font-medium text-slate-600"
        >
          닉네임
        </label>
        <input
          id="profile-nickname"
          type="text"
          name="nickname"
          autoComplete="nickname"
          required
          maxLength={MAX_LEN}
          value={nickname}
          onChange={(e) => setNickname(e.target.value.slice(0, MAX_LEN))}
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
      {done ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {done}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="btn btn-neutral rounded-xl"
      >
        {saving ? '저장 중…' : '저장'}
      </button>
    </form>
  );
}
