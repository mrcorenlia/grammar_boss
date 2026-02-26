import { describe, expect, it } from "vitest";
import { sentenceOne } from "./testFixtures";
import type { GNLinkModeUserInput } from "./types";
import { validateGNLinkMode } from "./validateGNLinkMode";

describe("validateGNLinkMode", () => {
  it("awards one point per exact dependent->noun link", () => {
    const input: GNLinkModeUserInput = {
      dependentIdToNounId: {
        t1: "t3",
        t2: "t3",
        t4: "t3",
      },
    };

    const result = validateGNLinkMode(input, sentenceOne);

    expect(result.correct).toBe(true);
    expect(result.score).toBe(3);
    expect(result.mistakes).toEqual([]);
  });

  it("filters links by eligibility", () => {
    const input: GNLinkModeUserInput = {
      dependentIdToNounId: {
        t1: "t3",
        t2: "wrong",
      },
      eligibleLinkIds: ["t1"],
    };

    const result = validateGNLinkMode(input, sentenceOne);

    expect(result.correct).toBe(true);
    expect(result.score).toBe(1);
    expect(result.interactionOutcomes).toHaveLength(1);
    expect(result.interactionOutcomes?.[0]?.interactionId).toBe("t1");
  });

  it("reports wrong links", () => {
    const input: GNLinkModeUserInput = {
      dependentIdToNounId: {
        t1: "t3",
        t2: "t1",
        t4: "t3",
      },
    };

    const result = validateGNLinkMode(input, sentenceOne);

    expect(result.correct).toBe(false);
    expect(result.score).toBe(2);
    expect(result.mistakes).toContain("Dependent t2 should link to t3 but got t1");
  });
});
