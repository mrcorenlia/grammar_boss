import type { BossDamageEvent } from "../core/types";

export type BossVisualPartState = {
  flash: boolean;
  cracked: boolean;
  exploding: boolean;
  destroyed: boolean;
};

export type BossVisualState = {
  partStates: Record<string, BossVisualPartState>;
  shake: boolean;
  defeated: boolean;
};

const createPartState = (): BossVisualPartState => ({
  flash: false,
  cracked: false,
  exploding: false,
  destroyed: false,
});

/**
 * Visual state is derived from events and can be replayed safely (idempotent reducer).
 */
export const createInitialBossVisualState = (partIds: string[]): BossVisualState => {
  const partStates: Record<string, BossVisualPartState> = {};
  for (const partId of partIds) {
    partStates[partId] = createPartState();
  }

  return {
    partStates,
    shake: false,
    defeated: false,
  };
};

export const applyBossEventsToVisualState = (
  previous: BossVisualState,
  events: BossDamageEvent[],
  options?: { reducedMotion?: boolean }
): BossVisualState => {
  const reducedMotion = options?.reducedMotion ?? false;
  const next = structuredClone(previous);

  for (const event of events) {
    if (event.type === "boss.part_damaged") {
      const partState = (next.partStates[event.partId] ??= createPartState());
      partState.flash = true;
      partState.cracked = true;
      if (!reducedMotion) {
        next.shake = true;
      }
      continue;
    }

    if (event.type === "boss.part_destroyed") {
      const partState = (next.partStates[event.partId] ??= createPartState());
      partState.destroyed = true;
      partState.exploding = true;
      continue;
    }

    next.defeated = true;
  }

  return next;
};

export const clearTransientVisualState = (state: BossVisualState): BossVisualState => {
  const next = structuredClone(state);
  next.shake = false;

  for (const partState of Object.values(next.partStates)) {
    partState.flash = false;
    partState.exploding = false;
  }

  return next;
};
