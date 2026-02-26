import type { BossState, BossTemplate } from "../core/types";

/**
 * Builds mutable battle state from immutable content template.
 */
export const createBossStateFromTemplate = (template: BossTemplate): BossState => {
  const parts = template.parts.map((part) => ({
    ...part,
    destroyed: part.currentHP <= 0,
  }));

  const maxHP = parts.reduce((sum, part) => sum + part.maxHP, 0);
  const totalHP = parts.reduce((sum, part) => sum + Math.max(0, part.currentHP), 0);

  return {
    id: template.id,
    name: template.name,
    totalHP,
    maxHP,
    parts,
    defeated: totalHP <= 0,
  };
};
