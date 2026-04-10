export type PartyInviteCreateRequest = {
  nickname: string;
  message: string;
};

/** GET /party-group-invites/received 원본 응답 */
export type PartyInviteReceivedResponse = {
  id: number;
  groupId: number;
  invitedUserId: number;
  invitedByUserId: number;
  status: string;
  message: string | null;
  createdAt: string;
  updatedAt: string;
  group?: {
    id: number;
    name?: string | null;
    description?: string | null;
  } | null;
  invitedByUser?: {
    id: number;
    username?: string | null;
    nickname?: string | null;
  } | null;
};

export type PartyInviteItem = {
  id: number;
  groupName: string;
  inviterName: string;
  message: string | null;
  createdAt: string | null;
  status?: string | null;
};

/** GET /party-group-invites/sent 원본 응답 */
export type PartyInviteSentResponse = {
  id: number;
  status: string;
  message: string | null;
  createdAt: string;
  updatedAt: string;
  group?: {
    id: number;
    name?: string | null;
    description?: string | null;
  } | null;
  invitedUser?: {
    id: number;
    username?: string | null;
    nickname?: string | null;
    displayName?: string | null;
  } | null;
};

export type PartySentInviteItem = {
  id: number;
  groupName: string;
  invitedUserName: string;
  message: string | null;
  status: string;
  createdAt: string | null;
};

