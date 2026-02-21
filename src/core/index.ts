// "Barrel file" for core type exports.
// Consumers can import from "src/core" instead of deep file paths.
// `export type` ensures these imports disappear at runtime and are type-only.
export type {
  BattleState,
  BossPartState,
  BossState,
  ComboState,
  GameMode,
  GNGroup,
  PartOfSpeech,
  PhraseGroup,
  ScoreState,
  Sentence,
  SentenceStructure,
  Token,
  ValidationBreakdown,
  ValidationResult
} from "./types";

// Content validation exports used by tests and future fixture checks.
export type { ContentValidationError, ContentValidationResult } from "./contentValidation"
export { validateBossesContent, validateSentencesContent } from "./contentValidation"
