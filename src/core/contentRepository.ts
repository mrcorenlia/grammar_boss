import bossesContent from "../content/bosses.json";
import sentencesContent from "../content/sentences.json";
import { validateBossesContent, validateSentencesContent } from "./contentValidation";
import type { BossTemplate, Sentence } from "./types";

const formatValidationErrors = (errors: { path: string; message: string }[]): string =>
  errors.map((error) => `${error.path}: ${error.message}`).join("\n");

// Loads sentence data from JSON content fixtures only.
// Modes should consume answers via this gateway instead of embedding literals.
export function loadSentencesFromContent(): Sentence[] {
  const result = validateSentencesContent(sentencesContent);
  if (!result.valid) {
    throw new Error(
      `Sentence content is invalid:\n${formatValidationErrors(result.errors)}`
    );
  }

  return structuredClone(sentencesContent) as Sentence[];
}

// Loads boss template data from JSON content fixtures only.
// Keeping this in core preserves mode/UI decoupling from raw fixture paths.
export function loadBossesFromContent(): BossTemplate[] {
  const result = validateBossesContent(bossesContent);
  if (!result.valid) {
    throw new Error(`Boss content is invalid:\n${formatValidationErrors(result.errors)}`);
  }

  return structuredClone(bossesContent) as BossTemplate[];
}
