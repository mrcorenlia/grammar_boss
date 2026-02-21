import {
  loadBossesFromContent,
  loadSentencesFromContent,
  type BossTemplate,
  type Sentence
} from "../core";

// Mode layer reads answer-bearing data through this gateway.
// This prevents inline answer constants from appearing in mode components.
export const getModeSentences = (): Sentence[] => loadSentencesFromContent();
export const getModeBosses = (): BossTemplate[] => loadBossesFromContent();
