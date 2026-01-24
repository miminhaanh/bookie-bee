export const LEVEL_SYSTEM = {
  1: { title: "Ong Non", icon: "🐝" },
  2: { title: "Ong Thợ", icon: "👷" },
  3: { title: "Ong Chăm", icon: "🌻" },
  4: { title: "Ong Chúa", icon: "👑" },
} as const satisfies Record<number, { title: string; icon: string }>;

export type LevelStageKey = keyof typeof LEVEL_SYSTEM;
export type LevelStage = (typeof LEVEL_SYSTEM)[LevelStageKey];

const resolveLevelStage = (level: number): LevelStageKey => {
  if (level <= 1) return 1;
  if (level <= 3) return 2;
  if (level <= 5) return 3;
  return 4;
};

export const getLevelTitle = (level: number): LevelStage => {
  const safeLevel = Number.isFinite(level) ? level : 1;
  const stage = resolveLevelStage(safeLevel);
  return LEVEL_SYSTEM[stage];
};
