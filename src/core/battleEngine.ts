import type {
  BossState,
  BossTemplate,
  ComboState,
  GameMode,
  ScoreState,
  Sentence,
  ValidationResult
} from "./types"
import type { TagModeUserInput } from "./validateTagMode"
import { validateTagMode } from "./validateTagMode"
import { executeValidator, type ModeValidator, type ValidatorRegistry } from "./validation"
import { formatValidationFeedbackMessage } from "./feedback"
import { createInitialComboState, updateComboState } from "./combo"
import {
  calculateRoundScore,
  type RoundScoreInput,
  type SpeedBonusHook
} from "./score"
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

export type RoundResult = ValidationResult & {
  comboState: ComboState
  scoreState: ScoreState
  bossState: BossState | null
  bossEvents: BossDamageEvent[]
}

const defaultValidators: ValidatorRegistry = {
  tagging: validateTagMode as ModeValidator<any>
}

export type BattleEngineScoringOptions = {
  basePointsPerCorrect?: number
  speedBonusHook?: SpeedBonusHook
  comboMaxMultiplier?: number
  bossTemplate?: BossTemplate
  damageFromRoundScore?: (roundScore: number) => number
}

export type BattleEngine = {
  validateRound: (payload: RoundPayload) => RoundResult
  getState: () => {
    comboState: ComboState
    scoreState: ScoreState
    bossState: BossState | null
  }
}

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

  const validateRound = (payload: RoundPayload): RoundResult => {
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
      baseValidationResult = executeValidator(
        validator as ModeValidator<any>,
        payload.userInput,
        payload.sentence
      )
    }

    const correctInteractionCount = baseValidationResult.score

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
    const roundScore = calculateRoundScore(roundScoreInput)
    const nextComboState = updateComboState(comboState, baseValidationResult.correct)
    const comboBonus = roundScore.totalScore * (nextComboState.multiplier - 1)
    const totalRoundScore = roundScore.totalScore + comboBonus
    const nextScoreState: ScoreState = {
      totalScore: scoreState.totalScore + totalRoundScore,
      roundScore: totalRoundScore,
      comboBonus,
      speedBonus: roundScore.speedBonus
    }

    comboState = nextComboState
    scoreState = nextScoreState

    let bossEvents: BossDamageEvent[] = []
    let bossDamageApplied = 0
    if (bossState) {
      bossDamageApplied = normalizeRoundDamage(
        totalRoundScore,
        scoringOptions.damageFromRoundScore
      )
      const bossDamageResult = applyDamageToBossState(bossState, bossDamageApplied)
      bossState = bossDamageResult.state
      bossEvents = bossDamageResult.events
    }

    return {
      ...baseValidationResult,
      score: totalRoundScore,
      breakdown: {
        ...(baseValidationResult.breakdown ?? {}),
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
      bossEvents
    }
  }

  const getState = () => ({
    comboState: cloneComboState(comboState),
    scoreState: cloneScoreState(scoreState),
    bossState: cloneBossState(bossState)
  })

  return {
    validateRound,
    getState
  }
}
