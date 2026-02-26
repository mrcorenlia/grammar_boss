import { useEffect, useMemo, useState } from "react";
import type { BossDamageEvent, BossState } from "../core/types";
import {
  applyBossEventsToVisualState,
  clearTransientVisualState,
  createInitialBossVisualState,
  type BossVisualState,
} from "./effects";

/**
 * Hook subscriber that keeps animation state synchronized with engine boss events.
 */
export const useBossVisualState = (payload: {
  bossState: BossState | null;
  bossEvents: BossDamageEvent[];
  reducedMotion?: boolean;
}): BossVisualState => {
  const partIds = useMemo(() => payload.bossState?.parts.map((part) => part.id) ?? [], [payload.bossState]);

  const [visualState, setVisualState] = useState<BossVisualState>(() => createInitialBossVisualState(partIds));

  useEffect(() => {
    setVisualState(createInitialBossVisualState(partIds));
  }, [partIds.join("|")]);

  useEffect(() => {
    if (payload.bossEvents.length === 0) {
      return;
    }

    const applyOptions = payload.reducedMotion === undefined ? undefined : { reducedMotion: payload.reducedMotion };
    setVisualState((previous) =>
      applyBossEventsToVisualState(previous, payload.bossEvents, applyOptions)
    );

    if (payload.reducedMotion) {
      return;
    }

    const handle = window.setTimeout(() => {
      setVisualState((previous) => clearTransientVisualState(previous));
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [payload.bossEvents, payload.reducedMotion]);

  return visualState;
};
