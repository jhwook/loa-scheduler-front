import { apiFetch } from "@/lib/api/client";
import type {
  PartyInviteCreateRequest,
  PartyInviteItem,
  PartyInviteReceivedResponse,
  PartyInviteSentResponse,
  PartySentInviteItem,
} from "@/types/party-invite";

const RECEIVED_INVITES_PATH = "/party-group-invites/received";
const SENT_INVITES_PATH = "/party-group-invites/sent";
const INVITES_PATH = (groupId: number) => `/party-groups/${groupId}/invites`;
const INVITE_ACCEPT_PATH = (inviteId: number) => `/party-group-invites/${inviteId}/accept`;
const INVITE_REJECT_PATH = (inviteId: number) => `/party-group-invites/${inviteId}/reject`;
const INVITE_CANCEL_PATH = (inviteId: number) => `/party-group-invites/${inviteId}/cancel`;

function normalizeInvite(raw: PartyInviteReceivedResponse): PartyInviteItem {
  const groupName = raw.group?.name?.trim() || "알 수 없는 공격대";
  const inviterName =
    raw.invitedByUser?.nickname?.trim() ||
    raw.invitedByUser?.username?.trim() ||
    "알 수 없음";

  return {
    id: raw.id,
    groupName,
    inviterName,
    message: raw.message ?? null,
    createdAt: raw.createdAt ?? null,
    status: raw.status ?? null,
  };
}

function normalizeSentInvite(raw: PartyInviteSentResponse): PartySentInviteItem {
  const groupName = raw.group?.name?.trim() || "알 수 없는 공격대";
  const invitedUserName =
    raw.invitedUser?.displayName?.trim() ||
    raw.invitedUser?.nickname?.trim() ||
    raw.invitedUser?.username?.trim() ||
    "알 수 없음";

  return {
    id: raw.id,
    groupName,
    invitedUserName,
    message: raw.message ?? null,
    status: raw.status ?? "PENDING",
    createdAt: raw.createdAt ?? null,
  };
}

export async function createPartyGroupInvite(
  groupId: number,
  body: PartyInviteCreateRequest,
): Promise<void> {
  await apiFetch<unknown>(INVITES_PATH(groupId), {
    method: "POST",
    json: {
      nickname: body.nickname,
      message: body.message,
    },
  });
}

export async function getReceivedPartyGroupInvites(): Promise<PartyInviteItem[]> {
  const raw = await apiFetch<PartyInviteReceivedResponse[]>(RECEIVED_INVITES_PATH, {
    method: "GET",
  });
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeInvite);
}

export async function getSentPartyGroupInvites(): Promise<PartySentInviteItem[]> {
  const raw = await apiFetch<PartyInviteSentResponse[]>(SENT_INVITES_PATH, {
    method: "GET",
  });
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeSentInvite);
}

export async function acceptPartyGroupInvite(inviteId: number): Promise<void> {
  await apiFetch<unknown>(INVITE_ACCEPT_PATH(inviteId), { method: "POST" });
}

export async function rejectPartyGroupInvite(inviteId: number): Promise<void> {
  await apiFetch<unknown>(INVITE_REJECT_PATH(inviteId), { method: "POST" });
}

export async function cancelPartyGroupInvite(inviteId: number): Promise<void> {
  await apiFetch<unknown>(INVITE_CANCEL_PATH(inviteId), { method: "POST" });
}

