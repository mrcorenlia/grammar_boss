import type { BossDamageEvent, BossState } from "../core/types";

/**
 * Sequentially applies damage through active boss parts.
 */
export const applyBossDamage = (
  bossState: BossState,
  incomingDamage: number
): { bossState: BossState; events: BossDamageEvent[] } => {
  const nextBossState: BossState = structuredClone(bossState);
  const events: BossDamageEvent[] = [];

  let remainingDamage = Math.max(0, Math.floor(incomingDamage));

  for (const part of nextBossState.parts) {
    if (remainingDamage <= 0) {
      break;
    }

    if (part.destroyed || part.currentHP <= 0) {
      continue;
    }

    const damageApplied = Math.min(part.currentHP, remainingDamage);
    part.currentHP -= damageApplied;
    remainingDamage -= damageApplied;

    events.push({
      type: "boss.part_damaged",
      partId: part.id,
      damage: damageApplied,
      remainingHP: part.currentHP,
    });

    if (part.currentHP <= 0) {
      part.currentHP = 0;
      part.destroyed = true;
      events.push({
        type: "boss.part_destroyed",
        partId: part.id,
        overflowDamage: remainingDamage,
      });
    }
  }

  nextBossState.totalHP = nextBossState.parts.reduce((sum, part) => sum + part.currentHP, 0);
  nextBossState.defeated = nextBossState.parts.every((part) => part.destroyed || part.currentHP <= 0);

  if (nextBossState.defeated && !bossState.defeated) {
    events.push({ type: "boss.defeated" });
  }

  return {
    bossState: nextBossState,
    events,
  };
};
