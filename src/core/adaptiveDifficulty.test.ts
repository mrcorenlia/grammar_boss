import { describe, expect, it } from "vitest";
import { calculateAdaptiveSentenceWeight, selectAdaptiveSentenceIndex } from "./adaptiveDifficulty";
import { allSentences } from "./testFixtures";
import type { PlayerStats } from "./types";

const baseStats: PlayerStats = {
  totals: { attempts: 0, correct: 0, incorrect: 0 },
  byMode: {},
  byDimension: {},
  byTag: {},
  avgResponseTimeMs: null,
  timedRounds: 0,
  confusionByDimension: {},
};

describe("adaptiveDifficulty", () => {
  it("weights weaker tags higher", () => {
    const strongStats: PlayerStats = {
      ...baseStats,
      byTag: {
        agreement: { attempts: 10, correct: 10, incorrect: 0 },
      },
    };

    const weakStats: PlayerStats = {
      ...baseStats,
      byTag: {
        agreement: { attempts: 10, correct: 2, incorrect: 8 },
      },
    };

    const strongWeight = calculateAdaptiveSentenceWeight(allSentences[0], strongStats);
    const weakWeight = calculateAdaptiveSentenceWeight(allSentences[0], weakStats);

    expect(weakWeight).toBeGreaterThan(strongWeight);
  });

  it("selects deterministic index excluding current sentence", () => {
    const stats: PlayerStats = {
      ...baseStats,
      byTag: {
        agreement: { attempts: 10, correct: 1, incorrect: 9 },
        structure: { attempts: 10, correct: 9, incorrect: 1 },
      },
    };

    const first = selectAdaptiveSentenceIndex({
      sentences: allSentences,
      currentSentenceIndex: 0,
      playerStats: stats,
    });

    const second = selectAdaptiveSentenceIndex({
      sentences: allSentences,
      currentSentenceIndex: 0,
      playerStats: stats,
    });

    expect(first).toBe(1);
    expect(second).toBe(first);
  });
});
