import type { PartyGroupDetail } from "@/types/party";

/**
 * 개발·UI 테스트용 목 데이터.
 *
 * 쿼리: /party?mock=empty → 빈 목록
 *       /party?mock=with (또는 생략) → 목 데이터 사용
 *
 * TODO: 실제 연동 시 이 파일 대신 API 호출로 교체
 *   - 예: GET /me/party-groups → PartyGroup[]
 *   - 예: GET /party-groups/:id → PartyGroupDetail
 */

export const MOCK_PARTY_GROUPS_WITH_DATA: PartyGroupDetail[] = [
  {
    id: 1,
    name: "카제로스 길드 공대",
    description: "주말 격추·일요일 풀클 위주",
    memberCount: 4,
    isActive: true,
    members: [
      {
        id: 101,
        userId: 1001,
        username: "user_alpha",
        nickname: "알파",
        displayName: "알파",
        characters: [
          {
            id: 10001,
            characterName: "그만넘어져",
            serverName: "카마인",
            itemAvgLevel: "5,143.70",
          },
          {
            id: 10002,
            characterName: "둘째캐",
            serverName: "카마인",
            itemAvgLevel: "4,980.00",
          },
        ],
      },
      {
        id: 102,
        userId: 1002,
        username: "user_beta",
        nickname: null,
        displayName: "베타",
        characters: [
          {
            id: 10003,
            characterName: "로아덕후",
            serverName: "실리안",
            itemAvgLevel: "5,200.00",
          },
        ],
      },
      {
        id: 103,
        userId: 1003,
        username: "user_gamma",
        nickname: "감마",
        displayName: "감마",
        characters: [],
      },
      {
        id: 104,
        userId: 1004,
        username: "user_delta",
        nickname: null,
        displayName: "델타",
        characters: [
          {
            id: 10004,
            characterName: "지원딜",
            serverName: "아만",
            itemAvgLevel: "4,850.00",
          },
        ],
      },
    ],
  },
  {
    id: 2,
    name: "평일 야간빌드",
    description: "화·목 22시",
    memberCount: 1,
    isActive: true,
    members: [
      {
        id: 201,
        userId: 2001,
        username: "lead1",
        nickname: null,
        displayName: "공대장",
        characters: [
          {
            id: 20001,
            characterName: "메인딜",
            serverName: "루페온",
            itemAvgLevel: "5,100.00",
          },
        ],
      },
    ],
  },
];
