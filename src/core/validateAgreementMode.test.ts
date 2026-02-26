import { describe, expect, it } from "vitest";
import { sentenceTwo } from "./testFixtures";
import type { AgreementModeUserInput } from "./types";
import { validateAgreementMode } from "./validateAgreementMode";

describe("validateAgreementMode", () => {
  it("scores nouns only when both gender and number match", () => {
    const input: AgreementModeUserInput = {
      nounIdToGender: {
        u2: "m",
        u6: "m",
      },
      nounIdToNumber: {
        u2: "p",
        u6: "s",
      },
    };

    const result = validateAgreementMode(input, sentenceTwo);

    expect(result.correct).toBe(true);
    expect(result.score).toBe(2);
    expect(result.mistakes).toEqual([]);
  });

  it("supports eligibility filtering", () => {
    const input: AgreementModeUserInput = {
      nounIdToGender: {
        u2: "f",
      },
      nounIdToNumber: {
        u2: "p",
      },
      eligibleNounIds: ["u6"],
    };

    const result = validateAgreementMode(input, sentenceTwo);

    expect(result.correct).toBe(false);
    expect(result.score).toBe(0);
    expect(result.interactionOutcomes).toHaveLength(1);
    expect(result.interactionOutcomes?.[0]?.interactionId).toBe("u6");
  });

  it("reports incorrect values", () => {
    const input: AgreementModeUserInput = {
      nounIdToGender: {
        u2: "m",
        u6: "f",
      },
      nounIdToNumber: {
        u2: "s",
        u6: "s",
      },
    };

    const result = validateAgreementMode(input, sentenceTwo);

    expect(result.correct).toBe(false);
    expect(result.score).toBe(0);
    expect(result.mistakes).toContain("Noun u2 expected m/p but got m/s");
    expect(result.mistakes).toContain("Noun u6 expected m/s but got f/s");
  });
});
