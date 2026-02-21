import bossesFixture from "../content/bosses.json";
import sentencesFixture from "../content/sentences.json";
import { loadBossesFromContent, loadSentencesFromContent } from "./contentRepository";

describe("contentRepository", () => {
  test("loads sentences from content fixtures", () => {
    const sentences = loadSentencesFromContent();
    expect(sentences).toEqual(sentencesFixture);
  });

  test("loads bosses from content fixtures", () => {
    const bosses = loadBossesFromContent();
    expect(bosses).toEqual(bossesFixture);
  });

  test("returns cloned sentence data so caller mutation does not alter fixture state", () => {
    const firstLoad = loadSentencesFromContent();
    const secondLoad = loadSentencesFromContent();
    expect(firstLoad).not.toBe(secondLoad);

    const sentence = firstLoad[0];
    const fixtureSentence = sentencesFixture[0];
    expect(sentence).toBeDefined();
    expect(fixtureSentence).toBeDefined();
    if (!sentence || !fixtureSentence) {
      throw new Error("Sentences fixture must include at least one sentence.");
    }

    sentence.text = "Mutated by test";
    const thirdLoad = loadSentencesFromContent();
    const thirdSentence = thirdLoad[0];
    expect(thirdSentence).toBeDefined();
    expect(thirdSentence?.text).toBe(fixtureSentence.text);
  });

  test("returns cloned boss data so caller mutation does not alter fixture state", () => {
    const firstLoad = loadBossesFromContent();
    const secondLoad = loadBossesFromContent();
    expect(firstLoad).not.toBe(secondLoad);

    const boss = firstLoad[0];
    const fixtureBoss = bossesFixture[0];
    expect(boss).toBeDefined();
    expect(fixtureBoss).toBeDefined();
    if (!boss || !fixtureBoss) {
      throw new Error("Boss fixtures must include at least one boss.");
    }

    boss.name = "Mutated Boss Name";
    const thirdLoad = loadBossesFromContent();
    const thirdBoss = thirdLoad[0];
    expect(thirdBoss).toBeDefined();
    expect(thirdBoss?.name).toBe(fixtureBoss.name);
  });
});
