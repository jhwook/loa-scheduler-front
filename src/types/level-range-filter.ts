/** GET /level-range-filters/admin 항목 */
export type LevelRangeFilter = {
  id: number;
  label: string;
  minLevel: number;
  maxLevel: number | null;
  orderNo: number;
  isActive: boolean;
};

/** POST /level-range-filters/admin */
export type CreateLevelRangeFilterRequest = {
  label: string;
  minLevel: number;
  maxLevel: number | null;
  orderNo: number;
  isActive: boolean;
};

/** PATCH /level-range-filters/admin/:id */
export type UpdateLevelRangeFilterRequest = Partial<{
  label: string;
  minLevel: number;
  maxLevel: number | null;
  orderNo: number;
  isActive: boolean;
}>;
