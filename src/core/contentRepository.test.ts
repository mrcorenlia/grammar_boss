import { describe, expect, it } from "vitest";
import { createContentRepository } from "./contentRepository";
import { bossTemplate, sentenceOne } from "./testFixtures";

describe("contentRepository", () => {
  it("loads validated content fixtures", () => {
    const repository = createContentRepository({
      sentences: [sentenceOne],
      bosses: [bossTemplate],
    });

    expect(repository.getSentences()).toEqual([sentenceOne]);
    expect(repository.getBossTemplates()).toEqual([bossTemplate]);
  });

  it("throws for invalid sentence fixtures", () => {
    expect(() =>
      createContentRepository({
        sentences: [{ ...sentenceOne, difficulty: 0 }],
        bosses: [bossTemplate],
      })
    ).toThrowError(/Invalid sentence content/);
  });

  it("finds content by id", () => {
    const repository = createContentRepository({
      sentences: [sentenceOne],
      bosses: [bossTemplate],
    });

    expect(repository.findSentenceById("s1")?.id).toBe("s1");
    expect(repository.findBossById("b1")?.id).toBe("b1");
  });
});
