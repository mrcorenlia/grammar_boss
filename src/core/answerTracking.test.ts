import { describe, expect, it } from "vitest";
import { createInitialAnswerTrackingState, getRoundConstraints, updateAnswerTrackingState } from "./answerTracking";
import { sentenceOne } from "./testFixtures";
import type { ValidationResult } from "./types";

describe("answerTracking", () => {
  it("returns full eligibility when nothing is solved", () => {
    const tracking = createInitialAnswerTrackingState();

    const constraints = getRoundConstraints({
      mode: "tagging",
      sentence: sentenceOne,
      tracking,
    });

    expect(constraints.lockedInteractionIds).toEqual([]);
    expect(constraints.preAnsweredInteractionIds).toEqual([]);
    expect(constraints.eligibleInteractionIds).toEqual(sentenceOne.tokens.map((token) => token.id));
  });

  it("locks solved interactions on repeated sentence rounds", () => {
    const tracking = createInitialAnswerTrackingState();
    const result: ValidationResult = {
      correct: false,
      score: 1,
      mistakes: ["x"],
      interactionOutcomes: [
        {
          mode: "tagging",
          sentenceId: sentenceOne.id,
          interactionId: "t1",
          dimension: "partOfSpeech",
          expected: "DET",
          received: "DET",
          correct: true,
        },
      ],
    };

    const updated = updateAnswerTrackingState(tracking, {
      mode: "tagging",
      sentence: sentenceOne,
      validationResult: result,
    });

    const constraints = getRoundConstraints({
      mode: "tagging",
      sentence: sentenceOne,
      tracking: updated,
    });

    expect(constraints.lockedInteractionIds).toEqual(["t1"]);
    expect(constraints.preAnsweredInteractionIds).toEqual(["t1"]);
    expect(constraints.eligibleInteractionIds).not.toContain("t1");
  });

  it("tracks stats buckets and timing", () => {
    const tracking = createInitialAnswerTrackingState();
    const result: ValidationResult = {
      correct: false,
      score: 1,
      mistakes: ["x"],
      interactionOutcomes: [
        {
          mode: "tagging",
          sentenceId: sentenceOne.id,
          interactionId: "t1",
          dimension: "partOfSpeech",
          expected: "DET",
          received: "DET",
          correct: true,
        },
        {
          mode: "tagging",
          sentenceId: sentenceOne.id,
          interactionId: "t2",
          dimension: "partOfSpeech",
          expected: "ADJ",
          received: "NOUN",
          correct: false,
        },
      ],
    };

    const updated = updateAnswerTrackingState(tracking, {
      mode: "tagging",
      sentence: sentenceOne,
      validationResult: result,
      elapsedMs: 15000,
    });

    expect(updated.playerStats.totals).toEqual({ attempts: 2, correct: 1, incorrect: 1 });
    expect(updated.playerStats.byTag.agreement).toEqual({ attempts: 2, correct: 1, incorrect: 1 });
    expect(updated.playerStats.avgResponseTimeMs).toBe(15000);
    expect(updated.playerStats.confusionByDimension.partOfSpeech.ADJ.NOUN).toBe(1);
  });
});
