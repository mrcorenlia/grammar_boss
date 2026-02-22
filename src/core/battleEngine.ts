import type {
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
}

const defaultValidators: ValidatorRegistry = {
  tagging: validateTagMode as ModeValidator<any>
}

export type BattleEngineScoringOptions = {
  basePointsPerCorrect?: number
  speedBonusHook?: SpeedBonusHook
  comboMaxMultiplier?: number
}

export type BattleEngine = {
  validateRound: (payload: RoundPayload) => RoundResult
  getState: () => {
    comboState: ComboState
    scoreState: ScoreState
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
        }
      },
      comboState: cloneComboState(nextComboState),
      scoreState: cloneScoreState(nextScoreState)
    }
  }

  const getState = () => ({
    comboState: cloneComboState(comboState),
    scoreState: cloneScoreState(scoreState)
  })

  return {
    validateRound,
    getState
  }
}
