// "Barrel file" for core type exports.
// Consumers can import from "src/core" instead of deep file paths.
// `export type` ensures these imports disappear at runtime and are type-only.
export type {
  BattleState,
  BossTemplate,
  BossTemplatePart,
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
  ValidationFeedbackMessage,
  ValidationBreakdown,
  ValidationResult
} from "./types";

// Normalized feedback helpers used by UI display layers.
export { formatValidationFeedbackMessage, getValidationMistakeMessages } from "./feedback"

// Score module exports used by engine integration in Iteration 4.
export type { RoundScoreInput, RoundScoreResult, SpeedBonusHook, SpeedBonusHookContext } from "./score"
export { calculateBaseScore, calculateRoundScore } from "./score"

// Content validation exports used by tests and future fixture checks.
export type { ContentValidationError, ContentValidationResult } from "./contentValidation"
export { validateBossesContent, validateSentencesContent } from "./contentValidation"

// Content repository exports used by modes to avoid inline answer coupling.
export { loadBossesFromContent, loadSentencesFromContent } from "./contentRepository"

// Gameplay validation contracts used by the engine and mode validators.
export type { ModeValidator, ValidatorRegistry } from "./validation"
export { assertValidationResult, executeValidator, isValidationResult } from "./validation"

// battleEngine exports used by UI modes for validation routing.
export type { BattleEngine, RoundPayload, TaggingRoundPayload } from "./battleEngine"
export { createBattleEngine } from "./battleEngine"

// Tag mode validator exports.
export type { TagModeUserInput } from "./validateTagMode"
export { validateTagMode } from "./validateTagMode"
