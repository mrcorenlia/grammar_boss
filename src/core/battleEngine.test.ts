import { describe, expect, it } from "vitest";
import { createBossStateFromTemplate } from "../boss/BossModel";
import { bossTemplate, sentenceOne } from "./testFixtures";
import { createBattleEngine } from "./battleEngine";

describe("battleEngine", () => {
  it("exposes required global state keys", () => {
    const engine = createBattleEngine({
      sentence: sentenceOne,
      mode: "tagging",
      bossState: createBossStateFromTemplate(bossTemplate),
    });

    const state = engine.getState();

    expect(state.currentSentence.id).toBe("s1");
    expect(state.currentMode).toBe("tagging");
    expect(state.bossState?.id).toBe("b1");
    expect(state.comboState).toEqual({ streak: 0, multiplier: 1 });
    expect(state.scoreState.total).toBe(0);
  });

  it("locks solved interactions on repeated sentence rounds", () => {
    const engine = createBattleEngine({
      sentence: sentenceOne,
      mode: "tagging",
      bossState: null,
    });

    const result = engine.submitRound({
      mode: "tagging",
      sentence: sentenceOne,
      userInput: {
        tokenIdToPOS: {
          t1: "DET",
          t2: "NOUN"
        }
      }
    });

    expect(result.correct).toBe(false);

    const constraints = engine.getRoundConstraints({
      mode: "tagging",
      sentence: sentenceOne,
    });

    expect(constraints.lockedInteractionIds).toContain("t1");
    expect(constraints.eligibleInteractionIds).not.toContain("t1");
  });
});
