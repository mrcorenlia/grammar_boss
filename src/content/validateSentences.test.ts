import sentences from "./sentences.json";
import { cloneSentence, validateSentenceContent } from "./validateSentences";

describe("validateSentenceContent", () => {
  it("accepts the checked-in sentence fixtures", () => {
    const errors = validateSentenceContent(sentences);

    expect(errors).toEqual([]);
  });

  it("rejects duplicate token ids", () => {
    const duplicated = cloneSentence(sentences[0]);

    const firstToken = duplicated.tokens[0];

    expect(firstToken).toBeDefined();

    duplicated.tokens.push({ ...firstToken!, text: "La-duplicate" });

    const errors = validateSentenceContent([duplicated]);

    expect(errors).toContain('sentence[0].tokens has duplicate id "t1"');
  });

  it("rejects invalid difficulty values", () => {
    const invalidDifficulty = cloneSentence(sentences[0]);

    invalidDifficulty.difficulty = 7;

    const errors = validateSentenceContent([invalidDifficulty]);

    expect(errors).toContain("sentence[0].difficulty must be a number between 1 and 5");
  });

  it("rejects missing required fields", () => {
    const missingFieldsFixture = [
      {
        id: "broken"
      }
    ];

    const errors = validateSentenceContent(missingFieldsFixture);

    expect(errors).toContain("sentence[0].text is required");
    expect(errors).toContain("sentence[0].difficulty must be a number between 1 and 5");
    expect(errors).toContain("sentence[0].tags is required");
    expect(errors).toContain("sentence[0].tokens is required");
  });
});
