import { describe, expect, it } from "vitest";
import { sentenceOne } from "./testFixtures";
import type { TagModeUserInput } from "./types";
import { validateTagMode } from "./validateTagMode";

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreeze(nested);
    }
  }
  return value;
};

describe("validateTagMode", () => {
  it("returns fully correct for matching tags", () => {
    const input: TagModeUserInput = {
      tokenIdToPOS: Object.fromEntries(sentenceOne.tokens.map((token) => [token.id, token.partOfSpeech])),
    };

    const result = validateTagMode(input, sentenceOne);

    expect(result.correct).toBe(true);
    expect(result.score).toBe(sentenceOne.tokens.length);
    expect(result.mistakes).toHaveLength(0);
    expect(result.interactionOutcomes).toHaveLength(sentenceOne.tokens.length);
  });

  it("reports mistakes and uses eligible token filtering", () => {
    const input: TagModeUserInput = {
      tokenIdToPOS: {
        t1: "NOUN",
        t2: "ADJ",
      },
      eligibleTokenIds: ["t1", "t2"],
    };

    const result = validateTagMode(input, sentenceOne);

    expect(result.correct).toBe(false);
    expect(result.score).toBe(1);
    expect(result.mistakes).toEqual(["Token t1 expected DET but got NOUN"]);
    expect(result.interactionOutcomes?.map((outcome) => outcome.interactionId)).toEqual(["t1", "t2"]);
  });

  it("is deterministic and does not mutate arguments", () => {
    const input: TagModeUserInput = {
      tokenIdToPOS: {
        t1: "DET",
        t2: "ADJ",
        t3: "NOUN",
      },
      eligibleTokenIds: ["t1", "t2", "t3"],
    };
    const frozenInput = deepFreeze(structuredClone(input));
    const frozenSentence = deepFreeze(structuredClone(sentenceOne));

    const first = validateTagMode(frozenInput, frozenSentence);
    const second = validateTagMode(frozenInput, frozenSentence);

    expect(second).toEqual(first);
    expect(frozenInput).toEqual(input);
    expect(frozenSentence).toEqual(sentenceOne);
  });
});
