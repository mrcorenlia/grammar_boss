import type {
  AnswerTrackingState,
  BossState,
  BossTemplate,
  ComboState,
  GameMode,
  PlayerStats,
  RoundAnswerConstraints,
  ScoreState,
  Sentence,
  ValidationFeedbackMessage,
  ValidationInteractionOutcome,
  ValidationResult
} from "./types"
import type { TagModeUserInput } from "./validateTagMode"
import { validateTagMode } from "./validateTagMode"
import type { StructureModeUserInput } from "./validateStructureMode"
import { validateStructureMode } from "./validateStructureMode"
import type { GNLinkModeUserInput } from "./validateGNLinkMode"
import { validateGNLinkMode } from "./validateGNLinkMode"
import type { AgreementModeUserInput } from "./validateAgreementMode"
import { validateAgreementMode } from "./validateAgreementMode"
import { executeValidator, type ModeValidator, type ValidatorRegistry } from "./validation"
import { formatValidationFeedbackMessage } from "./feedback"
import { createInitialComboState, updateComboState } from "./combo"
import {
  calculateRoundScore,
  type RoundScoreInput,
  type SpeedBonusHook
} from "./score"
import {
  createInitialAnswerTrackingState,
  deriveRoundConstraints,
  updateAnswerTrackingState,
  type PreAnsweredRule,
  type PreAnsweredRuleContext
} from "./answerTracking"
import { createBossStateFromTemplate } from "../boss/BossModel"
import { applyDamageToBossState, type BossDamageEvent } from "../boss/DamageSystem"

export type TaggingRoundPayload = {
  mode: "tagging"
  userInput: TagModeUserInput
  sentence: Sentence
}

export type RoundPayload = {
  mode: GameMode
  userInput: unknown
  sentence: Sentence
  elapsedMs?: number | null
}

export type StructureRoundPayload = {
  mode: "structure"
  userInput: StructureModeUserInput
  sentence: Sentence
}

export type GNLinkRoundPayload = {
  mode: "gn-link"
  userInput: GNLinkModeUserInput
  sentence: Sentence
}

export type AgreementRoundPayload = {
  mode: "agreement"
  userInput: AgreementModeUserInput
  sentence: Sentence
}

export type RoundResult = ValidationResult & {
  comboState: ComboState
  scoreState: ScoreState
  bossState: BossState | null
  bossEvents: BossDamageEvent[]
  constraints: RoundAnswerConstraints
  playerStats: PlayerStats
}

const defaultValidators: ValidatorRegistry = {
  tagging: validateTagMode as ModeValidator<any>,
  structure: validateStructureMode as ModeValidator<any>,
  "gn-link": validateGNLinkMode as ModeValidator<any>,
  agreement: validateAgreementMode as ModeValidator<any>
}

const constraintEnabledModes = new Set<GameMode>([
  "tagging",
  "structure",
  "gn-link",
  "agreement"
])

export type BattleEngineScoringOptions = {
  basePointsPerCorrect?: number
  speedBonusHook?: SpeedBonusHook
  comboMaxMultiplier?: number
  bossTemplate?: BossTemplate
  damageFromRoundScore?: (roundScore: number) => number
  preAnsweredRule?: PreAnsweredRule
}

export type BattleEngine = {
  validateRound: (payload: RoundPayload) => RoundResult
  getRoundConstraints: (payload: {
    mode: GameMode
    sentence: Sentence
  }) => RoundAnswerConstraints
  getState: () => {
    comboState: ComboState
    scoreState: ScoreState
    bossState: BossState | null
    answerTrackingState: AnswerTrackingState
  }
}

export type { PreAnsweredRuleContext }

const createInitialScoreState = (): ScoreState => ({
  totalScore: 0,
  roundScore: 0,
  comboBonus: 0,
  speedBonus: 0
})

const cloneComboState = (value: ComboState): ComboState => ({
  comboCount: value.comboCount,
  multiplier: value.multiplier,
  maxMultiplier: value.maxMultiplier
})

const cloneScoreState = (value: ScoreState): ScoreState => ({
  totalScore: value.totalScore,
  roundScore: value.roundScore,
  comboBonus: value.comboBonus,
  speedBonus: value.speedBonus
})

const clonePlayerStats = (value: PlayerStats): PlayerStats => ({
  totals: {
    attempts: value.totals.attempts,
    correct: value.totals.correct,
    incorrect: value.totals.incorrect
  },
  byMode: Object.fromEntries(
    Object.entries(value.byMode).flatMap(([mode, bucket]) =>
      bucket
        ? [
            [
              mode,
              {
                attempts: bucket.attempts,
                correct: bucket.correct,
                incorrect: bucket.incorrect
              }
            ]
          ]
        : []
    )
  ),
  byDimension: Object.fromEntries(
    Object.entries(value.byDimension).map(([dimension, bucket]) => [
      dimension,
      {
        attempts: bucket.attempts,
        correct: bucket.correct,
        incorrect: bucket.incorrect
      }
    ])
  ),
  byTag: Object.fromEntries(
    Object.entries(value.byTag).map(([tag, bucket]) => [
      tag,
      {
        attempts: bucket.attempts,
        correct: bucket.correct,
        incorrect: bucket.incorrect
      }
    ])
  ),
  avgResponseTimeMs: value.avgResponseTimeMs,
  timedRounds: value.timedRounds,
  confusionByDimension: Object.fromEntries(
    Object.entries(value.confusionByDimension).map(([dimension, expectedMap]) => [
      dimension,
      Object.fromEntries(
        Object.entries(expectedMap).map(([expected, receivedMap]) => [
          expected,
          { ...receivedMap }
        ])
      )
    ])
  )
})

const cloneRoundAnswerConstraints = (
  value: RoundAnswerConstraints
): RoundAnswerConstraints => ({
  lockedInteractionIds: [...value.lockedInteractionIds],
  preAnsweredInteractionIds: [...value.preAnsweredInteractionIds],
  eligibleInteractionIds: [...value.eligibleInteractionIds]
})

const cloneAnswerTrackingState = (
  value: AnswerTrackingState
): AnswerTrackingState => ({
  solvedKeys: { ...value.solvedKeys },
  roundIndex: value.roundIndex,
  playerStats: clonePlayerStats(value.playerStats)
})

const cloneBossState = (value: BossState | null): BossState | null => {
  if (!value) {
    return null
  }

  return {
    id: value.id,
    name: value.name,
    maxHP: value.maxHP,
    currentHP: value.currentHP,
    activePartId: value.activePartId,
    parts: value.parts.map((part) => ({
      id: part.id,
      name: part.name,
      maxHP: part.maxHP,
      currentHP: part.currentHP,
      svgElementId: part.svgElementId,
      destroyed: part.destroyed
    })),
    defeated: value.defeated
  }
}

const normalizeRoundDamage = (
  roundScore: number,
  damageFromRoundScore?: (roundScore: number) => number
): number => {
  const rawDamage = damageFromRoundScore ? damageFromRoundScore(roundScore) : roundScore
  if (!Number.isFinite(rawDamage)) {
    return 0
  }

  return Math.max(0, Math.trunc(rawDamage))
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const injectEligibleTokenIds = (
  userInput: unknown,
  eligibleTokenIds: string[]
): unknown => {
  if (!isRecord(userInput)) {
    return userInput
  }

  return {
    ...userInput,
    eligibleTokenIds: [...eligibleTokenIds]
  }
}

const injectEligiblePartIds = (
  userInput: unknown,
  eligiblePartIds: string[]
): unknown => {
  if (!isRecord(userInput)) {
    return userInput
  }

  return {
    ...userInput,
    eligiblePartIds: [...eligiblePartIds]
  }
}

const injectEligibleLinkIds = (
  userInput: unknown,
  eligibleLinkIds: string[]
): unknown => {
  if (!isRecord(userInput)) {
    return userInput
  }

  return {
    ...userInput,
    eligibleLinkIds: [...eligibleLinkIds]
  }
}

const injectEligibleNounIds = (
  userInput: unknown,
  eligibleNounIds: string[]
): unknown => {
  if (!isRecord(userInput)) {
    return userInput
  }

  return {
    ...userInput,
    eligibleNounIds: [...eligibleNounIds]
  }
}

const cloneFeedback = (
  feedback: ValidationFeedbackMessage[] | undefined
): ValidationFeedbackMessage[] =>
  feedback
    ? feedback.map((message) => {
        const clonedMessage: ValidationFeedbackMessage = {
          code: message.code,
          level: message.level
        }
        if (message.tokenId !== undefined) {
          clonedMessage.tokenId = message.tokenId
        }
        if (message.params !== undefined) {
          clonedMessage.params = { ...message.params }
        }

        return clonedMessage
      })
    : []

const withNoEligibleInteractionsFeedback = (
  feedback: ValidationFeedbackMessage[],
  payload: RoundPayload
): ValidationFeedbackMessage[] => [
  ...feedback,
  {
    code: "engine.no_eligible_interactions",
    level: "info",
    params: {
      mode: payload.mode,
      sentenceId: payload.sentence.id
    }
  }
]

const filterEligibleOutcomes = (
  outcomes: ValidationInteractionOutcome[] | undefined,
  payload: RoundPayload,
  constraints: RoundAnswerConstraints
): ValidationInteractionOutcome[] => {
  if (!outcomes || outcomes.length === 0) {
    return []
  }

  const eligibleSet = new Set(constraints.eligibleInteractionIds)
  return outcomes
    .filter(
      (outcome) =>
        outcome.mode === payload.mode &&
        outcome.sentenceId === payload.sentence.id &&
        eligibleSet.has(outcome.interactionId)
    )
    .map((outcome) => ({
      mode: outcome.mode,
      sentenceId: outcome.sentenceId,
      interactionId: outcome.interactionId,
      dimension: outcome.dimension,
      expected: outcome.expected,
      received: outcome.received,
      correct: outcome.correct
    }))
}

// Engine entrypoint for UI mode payloads.
// UI should submit interactions to this API instead of invoking validators directly.
export const createBattleEngine = (
  validatorOverrides: ValidatorRegistry = {},
  scoringOptions: BattleEngineScoringOptions = {}
): BattleEngine => {
  const validators: ValidatorRegistry = {
    ...defaultValidators,
    ...validatorOverrides
  }
  let comboState = createInitialComboState(scoringOptions.comboMaxMultiplier)
  let scoreState = createInitialScoreState()
  let bossState = scoringOptions.bossTemplate
    ? createBossStateFromTemplate(scoringOptions.bossTemplate)
    : null
  let answerTrackingState = createInitialAnswerTrackingState()

  const validateRound = (payload: RoundPayload): RoundResult => {
    const constraints = deriveRoundConstraints(
      answerTrackingState,
      payload.mode,
      payload.sentence,
      scoringOptions.preAnsweredRule
    )
    const supportsRoundConstraints = constraintEnabledModes.has(payload.mode)
    const validator = validators[payload.mode]
    let baseValidationResult: ValidationResult

    if (!validator) {
      const feedback = [
        {
          code: "engine.unregistered_mode",
          level: "error" as const,
          params: {
            mode: payload.mode
          }
        }
      ]

      baseValidationResult = {
        correct: false,
        score: 0,
        mistakes: feedback.map((message) => formatValidationFeedbackMessage(message)),
        feedback
      }
    } else {
      let userInput = payload.userInput
      if (payload.mode === "tagging") {
        userInput = injectEligibleTokenIds(userInput, constraints.eligibleInteractionIds)
      }
      if (payload.mode === "structure") {
        userInput = injectEligiblePartIds(userInput, constraints.eligibleInteractionIds)
      }
      if (payload.mode === "gn-link") {
        userInput = injectEligibleLinkIds(userInput, constraints.eligibleInteractionIds)
      }
      if (payload.mode === "agreement") {
        userInput = injectEligibleNounIds(userInput, constraints.eligibleInteractionIds)
      }
      baseValidationResult = executeValidator(
        validator as ModeValidator<any>,
        userInput,
        payload.sentence
      )
    }

    const eligibleOutcomes = supportsRoundConstraints
      ? filterEligibleOutcomes(baseValidationResult.interactionOutcomes, payload, constraints)
      : []
    const eligibleCorrectCount = eligibleOutcomes.filter((outcome) => outcome.correct).length
    const correctInteractionCount = supportsRoundConstraints
      ? eligibleOutcomes.length > 0
        ? eligibleCorrectCount
        : Math.max(0, Math.trunc(baseValidationResult.score))
      : Math.max(0, Math.trunc(baseValidationResult.score))
    const neutralRound =
      supportsRoundConstraints && constraints.eligibleInteractionIds.length === 0
    const roundFeedback = neutralRound
      ? withNoEligibleInteractionsFeedback(cloneFeedback(baseValidationResult.feedback), payload)
      : cloneFeedback(baseValidationResult.feedback)
    const roundMistakes = [...baseValidationResult.mistakes]

    // Validators emit a mode-level correctness score. The engine converts that
    // into score + combo state transitions for the global game loop.
    const roundScoreInput: RoundScoreInput = {
      correctInteractionCount,
      elapsedMs: payload.elapsedMs ?? null
    }

    if (scoringOptions.basePointsPerCorrect !== undefined) {
      roundScoreInput.basePointsPerCorrect = scoringOptions.basePointsPerCorrect
    }

    if (scoringOptions.speedBonusHook !== undefined) {
      roundScoreInput.speedBonusHook = scoringOptions.speedBonusHook
    }

    const normalizedCorrectInteractionCount = Math.max(
      0,
      Math.trunc(roundScoreInput.correctInteractionCount)
    )
    const roundScore = neutralRound
      ? {
          baseScore: 0,
          speedBonus: 0,
          totalScore: 0
        }
      : calculateRoundScore(roundScoreInput)
    const nextComboState = neutralRound
      ? cloneComboState(comboState)
      : updateComboState(comboState, baseValidationResult.correct)
    const comboBonus = neutralRound
      ? 0
      : roundScore.totalScore * (nextComboState.multiplier - 1)
    const totalRoundScore = roundScore.totalScore + comboBonus
    const nextScoreState: ScoreState = {
      totalScore: neutralRound ? scoreState.totalScore : scoreState.totalScore + totalRoundScore,
      roundScore: totalRoundScore,
      comboBonus,
      speedBonus: roundScore.speedBonus
    }

    comboState = nextComboState
    scoreState = nextScoreState
    answerTrackingState = updateAnswerTrackingState(
      answerTrackingState,
      supportsRoundConstraints ? eligibleOutcomes : [],
      {
        sentenceTags: payload.sentence.tags,
        elapsedMs: payload.elapsedMs ?? null
      }
    )

    let bossEvents: BossDamageEvent[] = []
    let bossDamageApplied = 0
    if (bossState && !neutralRound) {
      bossDamageApplied = normalizeRoundDamage(
        totalRoundScore,
        scoringOptions.damageFromRoundScore
      )
      const bossDamageResult = applyDamageToBossState(bossState, bossDamageApplied)
      bossState = bossDamageResult.state
      bossEvents = bossDamageResult.events
    }

    const roundResult: RoundResult = {
      ...baseValidationResult,
      mistakes: roundMistakes,
      score: totalRoundScore,
      breakdown: {
        ...(baseValidationResult.breakdown ?? {}),
        constraints: supportsRoundConstraints
          ? cloneRoundAnswerConstraints(constraints)
          : undefined,
        scoring: {
          correctInteractionCount: normalizedCorrectInteractionCount,
          baseScore: roundScore.baseScore,
          speedBonus: roundScore.speedBonus,
          comboMultiplier: nextComboState.multiplier,
          comboBonus,
          roundScore: totalRoundScore,
          totalScore: nextScoreState.totalScore
        },
        boss: bossState
          ? {
              damageApplied: bossDamageApplied,
              currentHP: bossState.currentHP,
              maxHP: bossState.maxHP,
              activePartId: bossState.activePartId,
              defeated: bossState.defeated
            }
          : undefined
      },
      comboState: cloneComboState(nextComboState),
      scoreState: cloneScoreState(nextScoreState),
      bossState: cloneBossState(bossState),
      bossEvents,
      constraints: cloneRoundAnswerConstraints(constraints),
      playerStats: clonePlayerStats(answerTrackingState.playerStats)
    }

    if (baseValidationResult.feedback !== undefined || roundFeedback.length > 0) {
      roundResult.feedback = roundFeedback
    }

    if (supportsRoundConstraints) {
      roundResult.interactionOutcomes = eligibleOutcomes
    } else if (baseValidationResult.interactionOutcomes !== undefined) {
      roundResult.interactionOutcomes = baseValidationResult.interactionOutcomes.map(
        (outcome) => ({
          mode: outcome.mode,
          sentenceId: outcome.sentenceId,
          interactionId: outcome.interactionId,
          dimension: outcome.dimension,
          expected: outcome.expected,
          received: outcome.received,
          correct: outcome.correct
        })
      )
    }

    return roundResult
  }

  const getRoundConstraints = (payload: {
    mode: GameMode
    sentence: Sentence
  }): RoundAnswerConstraints =>
    cloneRoundAnswerConstraints(
      deriveRoundConstraints(
        answerTrackingState,
        payload.mode,
        payload.sentence,
        scoringOptions.preAnsweredRule
      )
    )

  const getState = () => ({
    comboState: cloneComboState(comboState),
    scoreState: cloneScoreState(scoreState),
    bossState: cloneBossState(bossState),
    answerTrackingState: cloneAnswerTrackingState(answerTrackingState)
  })

  return {
    validateRound,
    getRoundConstraints,
    getState
  }
}
