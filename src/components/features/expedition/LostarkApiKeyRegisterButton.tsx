'use client';

import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useEffect, useState, type FormEvent } from 'react';

import { getMeHasApiToken, registerLostarkApiKey } from '@/lib/api/users';
import { getHasApiToken, setHasApiToken } from '@/lib/auth/storage';
import { ApiError } from '@/types/api';

/**
 * hasApiToken === false 일 때만 표시. 등록 성공 시 로컬 플래그를 true로 갱신.
 */
export function LostarkApiKeyRegisterButton() {
  const [ready, setReady] = useState(false);
  const [hasApiToken, setHasApiTokenState] = useState(true);
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  /** 폼 클라이언트 검증용 (미입력 등) */
  const [validationError, setValidationError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [mounted, setMounted] = useState(false);
  /** 등록 결과 안내 (성공/실패 — 서버 message 포함) */
  const [feedback, setFeedback] = useState<{
    kind: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    let alive = true;

    async function syncHasApiToken() {
      setMounted(true);
      try {
        const remoteHasApiToken = await getMeHasApiToken();
        if (!alive) return;
        setHasApiToken(remoteHasApiToken);
        setHasApiTokenState(remoteHasApiToken);
      } catch {
        if (!alive) return;
        setHasApiTokenState(getHasApiToken());
      } finally {
        if (alive) setReady(true);
      }
    }

    syncHasApiToken();

    return () => {
      alive = false;
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setValidationError(null);
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setValidationError('API KEY를 입력해 주세요.');
      return;
    }

    setPending(true);
    try {
      await registerLostarkApiKey({ apiKey: trimmed });
      setHasApiToken(true);
      setHasApiTokenState(true);
      setOpen(false);
      setApiKey('');
      setFeedback({
        kind: 'success',
        title: '등록 완료',
        message:
          'Lostark API KEY가 정상적으로 등록되었습니다. 이제 원정대 연동을 이용할 수 있어요.',
      });
    } catch (err) {
      let msg = '등록에 실패했습니다.';
      if (err instanceof ApiError) {
        msg = err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setFeedback({
        kind: 'error',
        title: '등록 실패',
        message: msg,
      });
    } finally {
      setPending(false);
    }
  }

  if (!ready) {
    return null;
  }

  /** 등록 버튼/입력 모달은 미등록 시에만. 성공 안내창은 등록 직후 hasApiToken=true여도 떠야 함 */
  const showRegisterUi = !hasApiToken;
  if (!showRegisterUi && !feedback) {
    return null;
  }

  return (
    <>
      {showRegisterUi ? (
        <>
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setValidationError(null);
            }}
            className="btn btn-outline btn-sm border-slate-300 bg-white text-slate-700"
          >
            API KEY 등록
          </button>

          {open && mounted
            ? createPortal(
                <div
                  className="fixed inset-0 z-100 flex min-h-dvh items-center justify-center p-4"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="lostark-api-key-modal-title"
                >
                  <button
                    type="button"
                    className="absolute inset-0 bg-slate-900/50"
                    aria-label="닫기"
                    onClick={() => !pending && setOpen(false)}
                  />
                  <div
                    className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h2
                      id="lostark-api-key-modal-title"
                      className="text-base font-semibold text-slate-900"
                    >
                      Lostark API KEY 등록
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      발급받은 API KEY를 입력하면 원정대 연동에 사용됩니다.
                    </p>

                    <div className="mt-3">
                      <Link
                        href="/guide/lostark-api-key"
                        className="btn btn-ghost btn-xs h-auto min-h-0 gap-1 px-0 text-sky-700 hover:bg-transparent hover:text-sky-800 hover:underline"
                        onClick={() => setOpen(false)}
                      >
                        API KEY 발급 방법 보기
                        <span aria-hidden>↗</span>
                      </Link>
                    </div>

                    <form onSubmit={onSubmit} className="mt-4 space-y-3">
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-slate-600">
                          API KEY
                        </span>
                        <input
                          type="password"
                          autoComplete="off"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="input input-bordered w-full border-slate-400 bg-white text-sm font-medium text-slate-900 caret-slate-900 placeholder:text-slate-500 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
                          placeholder="API KEY 입력"
                        />
                      </label>

                      {validationError ? (
                        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                          {validationError}
                        </p>
                      ) : null}

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => setOpen(false)}
                          className="btn btn-ghost btn-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                        >
                          취소
                        </button>
                        <button
                          type="submit"
                          disabled={pending}
                          className="btn btn-neutral btn-sm rounded-lg"
                        >
                          {pending ? '등록 중…' : '등록'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>,
                document.body
              )
            : null}
        </>
      ) : null}

      {feedback && mounted
        ? createPortal(
            <div
              className="fixed inset-0 z-110 flex min-h-dvh items-center justify-center p-4"
              role="alertdialog"
              aria-labelledby="api-key-feedback-title"
              aria-describedby="api-key-feedback-desc"
            >
              <button
                type="button"
                className="absolute inset-0 bg-slate-900/50"
                aria-label="닫기"
                onClick={() => setFeedback(null)}
              />
              <div
                className={`relative z-10 w-full max-w-sm rounded-2xl border bg-white p-6 shadow-2xl ${
                  feedback.kind === 'success'
                    ? 'border-emerald-200'
                    : 'border-rose-200'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <h3
                  id="api-key-feedback-title"
                  className={`text-base font-semibold ${
                    feedback.kind === 'success'
                      ? 'text-emerald-900'
                      : 'text-rose-900'
                  }`}
                >
                  {feedback.title}
                </h3>
                <p
                  id="api-key-feedback-desc"
                  className="mt-2 text-sm leading-relaxed text-slate-600"
                >
                  {feedback.message}
                </p>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="btn btn-neutral btn-sm rounded-lg px-6"
                    onClick={() => setFeedback(null)}
                  >
                    확인
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
