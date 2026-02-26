import type { ScoreState } from "./types";

export type RoundScoreComputation = {
  base: number;
  multiplied: number;
  speedBonus: number;
  total: number;
};

export const initialScoreState: ScoreState = {
  total: 0,
  lastRoundBase: 0,
  lastRoundBonus: 0,
  lastRoundTotal: 0,
};

/**
 * Pacing bonus is intentionally small and only applies for the target loop window.
 */
export const calculateRoundScore = (payload: {
  baseScore: number;
  comboMultiplier: number;
  elapsedMs?: number;
}): RoundScoreComputation => {
  const base = Math.max(0, payload.baseScore);
  const multiplied = base * Math.max(1, payload.comboMultiplier);
  const speedBonus =
    payload.elapsedMs !== undefined && payload.elapsedMs >= 10_000 && payload.elapsedMs <= 30_000 && base > 0
      ? 1
      : 0;

  return {
    base,
    multiplied,
    speedBonus,
    total: multiplied + speedBonus,
  };
};

export const applyRoundScore = (previous: ScoreState, roundScore: RoundScoreComputation): ScoreState => {
  return {
    total: previous.total + roundScore.total,
    lastRoundBase: roundScore.base,
    lastRoundBonus: roundScore.speedBonus,
    lastRoundTotal: roundScore.total,
  };
};
