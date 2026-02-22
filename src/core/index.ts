// "Barrel file" for core type exports.
// Consumers can import from "src/core" instead of deep file paths.
// `export type` ensures these imports disappear at runtime and are type-only.
export type {
  AnswerTrackingState,
  BattleState,
  BossTemplate,
  BossTemplatePart,
  BossPartState,
  BossState,
  InteractionKey,
  ComboState,
  GameMode,
  GNGroup,
  PartOfSpeech,
  PlayerStats,
  PhraseGroup,
  RoundAnswerConstraints,
  ScoreState,
  Sentence,
  SentenceStructure,
  StatsBucket,
  Token,
  ValidationFeedbackMessage,
  ValidationBreakdown,
  ValidationInteractionOutcome,
  ValidationResult
} from "./types";

// Normalized feedback helpers used by UI display layers.
export { formatValidationFeedbackMessage, getValidationMistakeMessages } from "./feedback"

// Combo module exports used by engine integration in Iteration 4.
export { calculateComboMultiplier, createInitialComboState, updateComboState } from "./combo"

// Score module exports used by engine integration in Iteration 4.
export type { RoundScoreInput, RoundScoreResult, SpeedBonusHook, SpeedBonusHookContext } from "./score"
export { calculateBaseScore, calculateRoundScore } from "./score"

// Answer tracking contracts used for cross-round locking and player stats.
export { buildInteractionKey, createInitialAnswerTrackingState, deriveRoundConstraints, listStructureInteractions, listTaggingInteractions, updateAnswerTrackingState } from "./answerTracking"
export type { PreAnsweredRule } from "./answerTracking"

// Content validation exports used by tests and future fixture checks.
export type { ContentValidationError, ContentValidationResult } from "./contentValidation"
export { validateBossesContent, validateSentencesContent } from "./contentValidation"

// Content repository exports used by modes to avoid inline answer coupling.
export { loadBossesFromContent, loadSentencesFromContent } from "./contentRepository"

// Gameplay validation contracts used by the engine and mode validators.
export type { ModeValidator, ValidatorRegistry } from "./validation"
export { assertValidationResult, executeValidator, isValidationResult } from "./validation"

// battleEngine exports used by UI modes for validation routing.
export type {
  BattleEngine,
  BattleEngineScoringOptions,
  PreAnsweredRuleContext,
  RoundPayload,
  RoundResult,
  StructureRoundPayload,
  TaggingRoundPayload
} from "./battleEngine"
export { createBattleEngine } from "./battleEngine"

// Tag mode validator exports.
export type { TagModeUserInput } from "./validateTagMode"
export { validateTagMode } from "./validateTagMode"

// Structure mode validator exports.
export type { StructureModeUserInput, StructurePartId } from "./validateStructureMode"
export { validateStructureMode } from "./validateStructureMode"
