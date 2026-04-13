import { normalizePartyRole } from "@/types/expedition";
import type {
  PartyCharacterWeeklyRaidHomework,
  PartyGroupDetail,
  PartyGroupMemberCharacter,
  PartyGroupMemberWithRoster,
} from "@/types/party";
import type {
  PartyGroupCharactersMemberResponse,
  PartyGroupCharactersResponse,
  PartyGroupDetailResponse,
  PartyGroupPublicCharacterResponse,
  PartyWeeklyRaidResponse,
} from "@/types/party-api";

export function getTotalCharacterCount(group: PartyGroupDetail): number {
  return group.members.reduce((n, m) => n + (m.characters?.length ?? 0), 0);
}

export function formatWeeklyRaidRow(raw: PartyWeeklyRaidResponse): {
  raidName: string;
  gatesLabel: string;
} {
  const raidName = raw.raidGateInfo?.raidInfo?.raidName ?? "알 수 없는 레이드";
  const difficulty = raw.raidGateInfo?.difficulty?.trim();
  const gateNumber = raw.raidGateInfo?.gateNumber;

  const tail = [
    difficulty && difficulty.length > 0 ? difficulty : null,
    typeof gateNumber === "number" ? `${gateNumber}관` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    raidName,
    gatesLabel: tail || "—",
  };
}

function mapWeeklyRaidsToHomework(
  weeklyRaids: PartyWeeklyRaidResponse[] | null | undefined,
): PartyCharacterWeeklyRaidHomework[] {
  const list = Array.isArray(weeklyRaids) ? weeklyRaids : [];

  // TODO: 같은 레이드명 기준으로 관문 범위(1~2관) 그룹핑하여 표시 개선
  return list.map((r) => {
    const { raidName, gatesLabel } = formatWeeklyRaidRow(r);
    return {
      id: String(r.id),
      raidName,
      difficulty: r.raidGateInfo?.difficulty ?? null,
      gateNumber: r.raidGateInfo?.gateNumber ?? null,
      gatesLabel,
      isCleared: Boolean(r.isCleared),
    };
  });
}

function mapMember(member: PartyGroupDetailResponse["members"][number]): PartyGroupMemberWithRoster {
  return {
    id: member.id,
    userId: member.userId,
    username: member.username,
    nickname: member.nickname,
    displayName: member.displayName || member.nickname || member.username,
    role: member.role,
    characters: (member.characters ?? []).map((c) => ({
      id: c.id,
      characterName: c.characterName,
      serverName: c.serverName,
      characterClassName: c.characterClassName,
      characterLevel: c.characterLevel ?? undefined,
      itemAvgLevel: c.itemAvgLevel ?? "",
      combatPower: c.combatPower ?? null,
      partyRole: normalizePartyRole(c.partyRole),
      weeklyRaids: mapWeeklyRaidsToHomework(c.weeklyRaids),
    })),
  };
}

export function mapPartyGroupDetailResponseToViewModel(
  raw: PartyGroupDetailResponse,
): PartyGroupDetail {
  const members: PartyGroupMemberWithRoster[] = (raw.members ?? []).map(mapMember);

  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? null,
    memberCount: members.length,
    isActive: Boolean(raw.isActive),
    ownerUserId: raw.ownerUserId,
    members,
  };
}

function mapPublicCharacter(
  c: PartyGroupPublicCharacterResponse,
): PartyGroupMemberCharacter {
  return {
    id: c.characterId,
    characterName: c.characterName,
    serverName: c.serverName?.trim() ? c.serverName.trim() : "",
    characterClassName: c.characterClassName,
    characterLevel: c.characterLevel ?? undefined,
    itemAvgLevel: c.itemAvgLevel ?? "",
    combatPower: c.combatPower ?? null,
    partyRole: normalizePartyRole(c.partyRole),
    weeklyRaids: mapWeeklyRaidsToHomework(c.weeklyRaids),
  };
}

function mapPublicMember(
  m: PartyGroupCharactersMemberResponse,
): PartyGroupMemberWithRoster {
  return {
    id: m.memberId,
    userId: m.userId,
    username: m.username,
    nickname: m.nickname,
    displayName: m.displayName?.trim()
      ? m.displayName
      : m.nickname?.trim()
        ? m.nickname
        : m.username,
    role: m.role,
    characters: (m.characters ?? []).map(mapPublicCharacter),
  };
}

/** GET /party-groups/:groupId/characters → 공대원 현황용 뷰 모델 */
export function mapPartyGroupCharactersResponseToViewModel(
  raw: PartyGroupCharactersResponse,
): PartyGroupDetail {
  const members: PartyGroupMemberWithRoster[] = (raw.members ?? []).map(
    mapPublicMember,
  );
  const owner = members.find((m) => m.role === "OWNER");

  return {
    id: raw.groupId,
    name: raw.groupName,
    description: null,
    memberCount: members.length,
    isActive: true,
    ownerUserId: owner?.userId,
    members,
  };
}

