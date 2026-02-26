import { describe, expect, it } from "vitest";
import { bossTemplate, sentenceOne } from "./testFixtures";
import { validateBossTemplatesContent, validateSentencesContent } from "./contentValidation";

describe("contentValidation", () => {
  it("accepts valid sentence and boss fixtures", () => {
    const sentenceResult = validateSentencesContent([sentenceOne]);
    const bossResult = validateBossTemplatesContent([bossTemplate]);

    expect(sentenceResult.valid).toBe(true);
    expect(sentenceResult.errors).toHaveLength(0);
    expect(bossResult.valid).toBe(true);
    expect(bossResult.errors).toHaveLength(0);
  });

  it("rejects duplicate token ids", () => {
    const duplicated = {
      ...sentenceOne,
      tokens: [...sentenceOne.tokens, { ...sentenceOne.tokens[0], text: "Duplicate" }],
    };

    const result = validateSentencesContent([duplicated]);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes("duplicate token id"))).toBe(true);
  });

  it("rejects out-of-range difficulty values", () => {
    const invalid = {
      ...sentenceOne,
      difficulty: 9,
    };

    const result = validateSentencesContent([invalid]);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes("difficulty"))).toBe(true);
  });

  it("rejects missing required fields", () => {
    const missingStructure = {
      ...sentenceOne,
      structure: undefined,
    };

    const result = validateSentencesContent([missingStructure as never]);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes("structure"))).toBe(true);
  });
});
