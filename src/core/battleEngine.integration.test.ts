import { describe, expect, it } from "vitest";
import { createBossStateFromTemplate } from "../boss/BossModel";
import { bossTemplate, sentenceOne, sentenceTwo } from "./testFixtures";
import { createBattleEngine } from "./battleEngine";

const buildTagInput = (sentence: typeof sentenceOne | typeof sentenceTwo) => ({
  tokenIdToPOS: Object.fromEntries(sentence.tokens.map((token) => [token.id, token.partOfSpeech])),
});

describe("battleEngine integration", () => {
  it("routes validation, updates combo/score, and applies damage", () => {
    const engine = createBattleEngine({
      sentence: sentenceOne,
      mode: "tagging",
      bossState: createBossStateFromTemplate(bossTemplate),
    });

    const first = engine.submitRound({
      mode: "tagging",
      sentence: sentenceOne,
      userInput: buildTagInput(sentenceOne),
      elapsedMs: 12000,
    });

    expect(first.correct).toBe(true);
    expect(first.comboState).toEqual({ streak: 1, multiplier: 1 });
    expect(first.scoreState.total).toBe(8);
    expect(first.bossState?.totalHP).toBe(92);

    const second = engine.submitRound({
      mode: "tagging",
      sentence: sentenceTwo,
      userInput: buildTagInput(sentenceTwo),
      elapsedMs: 5000,
    });

    expect(second.correct).toBe(true);
    expect(second.comboState).toEqual({ streak: 2, multiplier: 2 });
    expect(second.scoreState.total).toBe(22);
    expect(second.bossState?.totalHP).toBe(78);
  });
});
