import rawBosses from "../content/bosses.json";
import rawSentences from "../content/sentences.json";
import { validateBossTemplatesContent, validateSentencesContent } from "./contentValidation";
import type { BossTemplate, Sentence } from "./types";

type ContentRepository = {
  getSentences(): Sentence[];
  getBossTemplates(): BossTemplate[];
  findSentenceById(sentenceId: string): Sentence | undefined;
  findBossById(bossId: string): BossTemplate | undefined;
};

const freezeDeep = <T>(value: T): T => {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const nested of Object.values(value as Record<string, unknown>)) {
      freezeDeep(nested);
    }
  }
  return value;
};

/**
 * Repository centralizes JSON loading so mode UI never hardcodes answer keys.
 */
export const createContentRepository = (seed?: {
  sentences?: unknown;
  bosses?: unknown;
}): ContentRepository => {
  const sentenceSource = seed?.sentences ?? rawSentences;
  const bossSource = seed?.bosses ?? rawBosses;

  const sentenceValidation = validateSentencesContent(sentenceSource);
  if (!sentenceValidation.valid) {
    throw new Error(`Invalid sentence content: ${sentenceValidation.errors.join("; ")}`);
  }

  const bossValidation = validateBossTemplatesContent(bossSource);
  if (!bossValidation.valid) {
    throw new Error(`Invalid boss content: ${bossValidation.errors.join("; ")}`);
  }

  const sentences = freezeDeep(structuredClone(sentenceSource as Sentence[]));
  const bosses = freezeDeep(structuredClone(bossSource as BossTemplate[]));

  return {
    getSentences: () => sentences,
    getBossTemplates: () => bosses,
    findSentenceById: (sentenceId) => sentences.find((sentence) => sentence.id === sentenceId),
    findBossById: (bossId) => bosses.find((boss) => boss.id === bossId),
  };
};

export const contentRepository = createContentRepository();
