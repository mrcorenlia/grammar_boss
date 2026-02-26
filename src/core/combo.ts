import type { ComboState } from "./types";

/**
 * Combo progression is deterministic and capped at 3x.
 */
export const initialComboState: ComboState = {
  streak: 0,
  multiplier: 1,
};

export const comboMultiplierFromStreak = (streak: number): number => {
  return Math.min(3, 1 + Math.floor(streak / 2));
};

export const updateComboState = (previous: ComboState, roundCorrect: boolean): ComboState => {
  if (!roundCorrect) {
    return initialComboState;
  }

  const streak = previous.streak + 1;
  return {
    streak,
    multiplier: comboMultiplierFromStreak(streak),
  };
};
