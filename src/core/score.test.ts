import { describe, expect, it } from "vitest";
import { applyRoundScore, calculateRoundScore, initialScoreState } from "./score";

describe("score", () => {
  it("applies combo multiplier to base score", () => {
    const computed = calculateRoundScore({
      baseScore: 3,
      comboMultiplier: 2,
    });

    expect(computed).toEqual({
      base: 3,
      multiplied: 6,
      speedBonus: 0,
      total: 6,
    });
  });

  it("adds optional pacing bonus for 10-30s rounds", () => {
    const computed = calculateRoundScore({
      baseScore: 2,
      comboMultiplier: 1,
      elapsedMs: 12500,
    });

    expect(computed.speedBonus).toBe(1);
    expect(computed.total).toBe(3);
  });

  it("updates cumulative score state", () => {
    const computed = calculateRoundScore({
      baseScore: 2,
      comboMultiplier: 3,
    });
    const next = applyRoundScore(initialScoreState, computed);

    expect(next).toEqual({
      total: 6,
      lastRoundBase: 2,
      lastRoundBonus: 0,
      lastRoundTotal: 6,
    });
  });
});
