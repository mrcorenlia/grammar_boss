import { describe, expect, it } from "vitest";
import { sentenceTwo } from "./testFixtures";
import type { StructureModeUserInput } from "./types";
import { validateStructureMode } from "./validateStructureMode";

describe("validateStructureMode", () => {
  it("scores each sentence part exactly", () => {
    const input: StructureModeUserInput = {
      subjectTokenIds: ["u2", "u1"],
      predicateTokenIds: ["u3"],
      complementTokenIds: ["u4", "u5", "u6"],
    };

    const result = validateStructureMode(input, sentenceTwo);

    expect(result.correct).toBe(true);
    expect(result.score).toBe(3);
    expect(result.mistakes).toEqual([]);
    expect(result.interactionOutcomes?.map((outcome) => outcome.interactionId)).toEqual([
      "subject",
      "predicate",
      "complement",
    ]);
  });

  it("supports eligible part filtering", () => {
    const input: StructureModeUserInput = {
      subjectTokenIds: ["u1"],
      predicateTokenIds: ["u3"],
      complementTokenIds: ["u4", "u5", "u6"],
      eligiblePartIds: ["predicate"],
    };

    const result = validateStructureMode(input, sentenceTwo);

    expect(result.correct).toBe(true);
    expect(result.score).toBe(1);
    expect(result.interactionOutcomes).toHaveLength(1);
    expect(result.interactionOutcomes?.[0]?.interactionId).toBe("predicate");
  });

  it("reports complement mistakes when sentence has complement", () => {
    const input: StructureModeUserInput = {
      subjectTokenIds: ["u1", "u2"],
      predicateTokenIds: ["u3"],
      complementTokenIds: [],
    };

    const result = validateStructureMode(input, sentenceTwo);

    expect(result.correct).toBe(false);
    expect(result.score).toBe(2);
    expect(result.mistakes).toContain("Incorrect complement token set");
  });
});
