'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  acceptPartyGroupInvite,
  getReceivedPartyGroupInvites,
  rejectPartyGroupInvite,
} from '@/lib/api/party-group-invites';
import { logoutApi } from '@/lib/api/auth';
import { clearAuthStorage, hasAuthSession } from '@/lib/auth/storage';
import {
  checkNicknameAvailability,
  getMe,
  updateMyProfile,
} from '@/lib/api/users';
import { ApiError } from '@/types/api';
import type { PartyInviteItem } from '@/types/party-invite';

type MeSummary = {
  nickname: string | null;
  profileImageUrl: string | null;
};

function pickMeSummary(raw: Awaited<ReturnType<typeof getMe>>): MeSummary {
  return {
    nickname: raw.nickname ?? raw.user?.nickname ?? null,
    profileImageUrl: raw.profileImageUrl ?? raw.user?.profileImageUrl ?? null,
  };
}

function DefaultAvatarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M10 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-2" />
      <path d="M15 12H3" />
      <path d="m7 8-4 4 4 4" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M14.5 18a2.5 2.5 0 0 1-5 0" />
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
    </svg>
  );
}

export function UserMenu() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nickname, setNickname] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [nextNickname, setNextNickname] = useState('');
  const [checking, setChecking] = useState(false);
  const [checkDoneFor, setCheckDoneFor] = useState<string | null>(null);
  const [checkAvailable, setCheckAvailable] = useState<boolean | null>(null);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);
  const [savingNick, setSavingNick] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [invitesOpen, setInvitesOpen] = useState(false);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [invitesError, setInvitesError] = useState<string | null>(null);
  const [invites, setInvites] = useState<PartyInviteItem[]>([]);
  const [inviteActingId, setInviteActingId] = useState<number | null>(null);
  const [inviteCount, setInviteCount] = useState(0);

  async function loadReceivedInvites() {
    setInvitesLoading(true);
    setInvitesError(null);
    try {
      const rows = await getReceivedPartyGroupInvites();
      setInvites(rows);
      setInviteCount(rows.length);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '받은 초대를 불러오지 못했습니다.';
      setInvitesError(msg);
      setInvites([]);
      setInviteCount(0);
    } finally {
      setInvitesLoading(false);
    }
  }

  useEffect(() => {
    setMounted(true);
    if (!hasAuthSession()) {
      setIsLoggedIn(false);
      setNickname(null);
      setProfileImageUrl(null);
      return;
    }
    setIsLoggedIn(true);
    void getMe()
      .then((me) => {
        const summary = pickMeSummary(me);
        setNickname(summary.nickname);
        setProfileImageUrl(summary.profileImageUrl);
      })
      .catch(() => {
        // 프로필 조회 실패 시에도 헤더 기본 동작은 유지
        setNickname(null);
        setProfileImageUrl(null);
      });
    void getReceivedPartyGroupInvites()
      .then((rows) => setInviteCount(rows.length))
      .catch(() => setInviteCount(0));
  }, []);

  async function onLogout() {
    setLoggingOut(true);
    try {
      await logoutApi();
    } catch {
      // 서버 응답 실패와 무관하게 클라이언트 인증정보는 정리
    } finally {
      clearAuthStorage();
      setIsLoggedIn(false);
      setNickname(null);
      setProfileImageUrl(null);
      setLoggingOut(false);
      router.replace('/login');
      router.refresh();
    }
  }

  function openNicknameModal() {
    const current = nickname?.trim() ?? '';
    setNextNickname(current);
    setCheckDoneFor(null);
    setCheckAvailable(null);
    setCheckMessage(null);
    setModalOpen(true);
  }

  async function onCheckNickname() {
    const value = nextNickname.trim();
    if (!value) {
      setCheckAvailable(false);
      setCheckDoneFor(null);
      setCheckMessage('닉네임을 입력해 주세요.');
      return;
    }

    setChecking(true);
    setCheckMessage(null);
    try {
      const result = await checkNicknameAvailability(value);
      setCheckDoneFor(value);
      setCheckAvailable(result.available);
      setCheckMessage(
        result.message ??
          (result.available
            ? '사용 가능한 닉네임입니다.'
            : '이미 사용 중인 닉네임입니다.')
      );
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '닉네임 중복 확인에 실패했습니다.';
      setCheckAvailable(false);
      setCheckDoneFor(null);
      setCheckMessage(message);
    } finally {
      setChecking(false);
    }
  }

  async function onSaveNickname() {
    const value = nextNickname.trim();
    if (!value) {
      setCheckMessage('닉네임을 입력해 주세요.');
      return;
    }
    const current = nickname?.trim() ?? '';
    const changed = value !== current;
    if (changed && (!checkAvailable || checkDoneFor !== value)) {
      setCheckMessage('닉네임 중복 체크를 먼저 진행해 주세요.');
      return;
    }

    setSavingNick(true);
    setCheckMessage(null);
    try {
      const me = await updateMyProfile({ nickname: value });
      const summary = pickMeSummary(me);
      setNickname(summary.nickname);
      setModalOpen(false);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '닉네임 변경에 실패했습니다.';
      setCheckMessage(message);
    } finally {
      setSavingNick(false);
    }
  }

  function openInvitesModal() {
    setInvitesOpen(true);
    void loadReceivedInvites();
  }

  async function onHandleInvite(inviteId: number, action: 'accept' | 'reject') {
    setInviteActingId(inviteId);
    try {
      if (action === 'accept') {
        await acceptPartyGroupInvite(inviteId);
      } else {
        await rejectPartyGroupInvite(inviteId);
      }
      await loadReceivedInvites();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '요청 처리에 실패했습니다.';
      setInvitesError(msg);
    } finally {
      setInviteActingId(null);
    }
  }

  if (!isLoggedIn) {
    return (
      <button
        type="button"
        className="btn btn-neutral btn-sm"
        onClick={() => router.push('/login')}
      >
        로그인
      </button>
    );
  }

  return (
    <>
      <div className="dropdown dropdown-end relative z-100">
        <button
          type="button"
          tabIndex={0}
          className="btn btn-ghost btn-circle avatar indicator"
          aria-label="사용자 메뉴 열기"
        >
          {inviteCount > 0 ? (
            <span className="indicator-item badge badge-info badge-sm text-white">
              {inviteCount > 99 ? '99+' : inviteCount}
            </span>
          ) : null}
          <div className="w-9 rounded-full border border-slate-300 bg-white text-slate-600">
            {profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profileImageUrl} alt="사용자 아바타" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <DefaultAvatarIcon />
              </div>
            )}
          </div>
        </button>

        <ul
          tabIndex={0}
          className="menu dropdown-content z-9999 mt-2 w-52 rounded-box border border-slate-200 bg-white p-2 text-slate-700 shadow-xl"
        >
          <li className="pointer-events-none mb-1 rounded-md px-2 py-1 text-xs text-slate-500">
            닉네임: {nickname?.trim() ? nickname : '없음'}
          </li>
          <li>
            <button type="button" onClick={openInvitesModal}>
              <BellIcon />
              알림
              <span className="badge badge-info badge-sm ml-auto text-white">
                {inviteCount}
              </span>
            </button>
          </li>
          <li>
            <button type="button" onClick={openNicknameModal}>
              <EditIcon />
              닉네임 변경
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => void onLogout()}
              disabled={loggingOut}
            >
              <SignOutIcon />
              {loggingOut ? '로그아웃 중…' : '로그아웃'}
            </button>
          </li>
        </ul>
      </div>

      {modalOpen && mounted
        ? createPortal(
            <div className="fixed inset-0 z-10000 grid place-items-center bg-slate-950/45 p-4">
              <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
                <div className="mb-4 flex items-center gap-2">
                  <ProfileIcon />
                  <h3 className="text-base font-semibold text-slate-900">
                    닉네임 변경
                  </h3>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="change-nickname"
                    className="text-xs font-medium text-slate-600"
                  >
                    새 닉네임
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="change-nickname"
                      type="text"
                      value={nextNickname}
                      onChange={(e) => {
                        setNextNickname(e.target.value.slice(0, 20));
                        setCheckDoneFor(null);
                        setCheckAvailable(null);
                      }}
                      maxLength={20}
                      className="input input-bordered input-sm w-full border-slate-200 bg-white text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => void onCheckNickname()}
                      disabled={checking}
                      className="btn btn-outline btn-sm border-slate-300"
                    >
                      {checking ? '확인 중…' : '중복체크'}
                    </button>
                  </div>
                  <p
                    className={`text-xs ${
                      checkAvailable === null
                        ? 'text-slate-500'
                        : checkAvailable
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                    }`}
                  >
                    {checkMessage ?? '중복체크 후 저장해 주세요.'}
                  </p>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setModalOpen(false)}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm text-slate-950"
                    onClick={() => void onSaveNickname()}
                    disabled={savingNick}
                  >
                    {savingNick ? '저장 중…' : '저장'}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      {invitesOpen && mounted
        ? createPortal(
            <div className="fixed inset-0 z-10000 grid place-items-center bg-base-100/70 p-4 backdrop-blur-sm">
              <div className="w-full max-w-2xl rounded-2xl border border-base-300 bg-base-200 p-5 shadow-2xl">
                <div className="mb-3 flex items-center justify-between border-b border-base-300 pb-3">
                  <h3 className="text-base font-semibold text-base-content">
                    받은 초대
                  </h3>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-base-content/85 hover:bg-base-300"
                    onClick={() => setInvitesOpen(false)}
                  >
                    닫기
                  </button>
                </div>

                {invitesLoading ? (
                  <div className="space-y-3 py-2">
                    {Array.from({ length: 2 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-base-300 bg-base-300/50 p-4"
                      >
                        <div className="skeleton h-4 w-36 rounded-md" />
                        <div className="mt-2 skeleton h-3 w-28 rounded-md" />
                        <div className="mt-3 skeleton h-3 w-2/3 rounded-md" />
                        <div className="mt-2 skeleton h-3 w-44 rounded-md" />
                        <div className="mt-3 flex justify-end gap-2">
                          <div className="skeleton h-8 w-14 rounded-lg" />
                          <div className="skeleton h-8 w-14 rounded-lg" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : invitesError ? (
                  <div className="rounded-lg border border-rose-900/40 bg-rose-950/20 px-3 py-3 text-sm text-rose-100">
                    {invitesError}
                  </div>
                ) : invites.length === 0 ? (
                  <p className="py-8 text-center text-sm text-base-content/60">
                    받은 초대가 없습니다.
                  </p>
                ) : (
                  <div className="max-h-[60vh] space-y-3 overflow-auto pr-1">
                    {invites.map((inv) => (
                      <div
                        key={inv.id}
                        className="rounded-xl border border-base-300 bg-base-300/45 px-4 py-3"
                      >
                        <div className="text-sm font-semibold text-base-content">
                          {inv.groupName}
                        </div>
                        <p className="mt-1 text-xs text-base-content/65">
                          초대한 사람: {inv.inviterName}
                        </p>
                        <p className="mt-1 text-sm text-base-content/90">
                          {inv.message?.trim() ? inv.message : '메시지 없음'}
                        </p>
                        <p className="mt-1 text-xs text-base-content/65">
                          생성일:{' '}
                          {inv.createdAt
                            ? new Date(inv.createdAt).toLocaleString()
                            : '-'}
                        </p>
                        <div className="mt-3 flex justify-end gap-2">
                          <button
                            type="button"
                            className="btn btn-sm border-rose-500/45 bg-rose-950/20 text-rose-200 hover:border-rose-400/60 hover:bg-rose-900/35"
                            disabled={inviteActingId === inv.id}
                            onClick={() =>
                              void onHandleInvite(inv.id, 'reject')
                            }
                          >
                            거절
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm border-emerald-500/60 bg-emerald-900/45 text-emerald-100 hover:border-emerald-400/75 hover:bg-emerald-800/55"
                            disabled={inviteActingId === inv.id}
                            onClick={() =>
                              void onHandleInvite(inv.id, 'accept')
                            }
                          >
                            {inviteActingId === inv.id ? '처리 중…' : '수락'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
