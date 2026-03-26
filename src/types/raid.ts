export type RaidGateInfo = {
  id: number;
  raidInfoId?: number;
  raidId?: number;
  difficulty: string;
  gateNumber: number;
  gateName: string;
  minItemLevel: number;
  rewardGold: number;
  boundGold: number;
  isSingleMode: boolean;
  canExtraReward: boolean;
  extraRewardCost: number | null;
  orderNo: number;
  isActive: boolean;
};

export type RaidInfo = {
  id: number;
  raidName: string;
  description: string;
  orderNo: number;
  isActive: boolean;
  raidGates?: RaidGateInfo[];
};

export type CreateRaidRequest = {
  raidName: string;
  description: string;
  orderNo: number;
  isActive: boolean;
};

export type UpdateRaidRequest = Partial<CreateRaidRequest>;

export type CreateRaidGateRequest = {
  difficulty: string;
  gateNumber: number;
  gateName: string;
  minItemLevel: number;
  rewardGold: number;
  boundGold: number;
  isSingleMode: boolean;
  canExtraReward: boolean;
  extraRewardCost: number;
  orderNo: number;
  isActive: boolean;
};

export type UpdateRaidGateRequest = Partial<CreateRaidGateRequest>;

export type RaidSimple = {
  id: number;
  raidName: string;
};

export type RaidGateDetail = {
  raidGateInfoId: number;
  difficulty: string;
  gateNumber: number;
  gateName: string;
  minItemLevel: number;
  rewardGold: number;
  boundGold: number;
  canExtraReward: boolean;
  extraRewardCost: number;
  isSingleMode: boolean;
};

export type RaidDifficultySection = {
  difficulty: string;
  gates: RaidGateDetail[];
};

export type RaidDetail = {
  id: number;
  raidName: string;
  difficulties: RaidDifficultySection[];
};

export type WeeklyRaidGateSelection = {
  raidGateInfoId: number;
  isExtraRewardSelected: boolean;
};

export type CreateCharacterWeeklyRaidsRequest = {
  raidGateSelections: WeeklyRaidGateSelection[];
};

export type CharacterWeeklyRaidItem = {
  id: number;
  characterId: number;
  raidGateInfoId: number;
  isCleared: boolean;
  isGoldEarned: boolean;
  isExtraRewardSelected: boolean;
  extraRewardCostSnapshot: number | null;
  clearedAt: string | null;
  createdAt: string;
  updatedAt: string;
  raidGateInfo: {
    id: number;
    raidInfoId: number;
    difficulty: string;
    gateNumber: number;
    gateName: string;
    minItemLevel: string;
    rewardGold: number;
    boundGold: number;
    isSingleMode: boolean;
    canExtraReward: boolean;
    extraRewardCost: number;
    orderNo: number;
    isActive: boolean;
    raidInfo: {
      id: number;
      raidName: string;
      description: string;
      orderNo: number;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    };
  };
};

export type UpdateCharacterWeeklyRaidRequest = {
  characterId: number;
  data: {
    raidGateInfoId: number;
    isExtraRewardSelected: boolean;
  };
};
