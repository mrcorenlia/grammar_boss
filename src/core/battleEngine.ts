import type { GameMode, Sentence, ValidationResult } from "./types"
import type { TagModeUserInput } from "./validateTagMode"
import { validateTagMode } from "./validateTagMode"
import { executeValidator, type ModeValidator, type ValidatorRegistry } from "./validation"
import { formatValidationFeedbackMessage } from "./feedback"

export type TaggingRoundPayload = {
  mode: "tagging"
  userInput: TagModeUserInput
  sentence: Sentence
}

export type RoundPayload = {
  mode: GameMode
  userInput: unknown
  sentence: Sentence
}

const defaultValidators: ValidatorRegistry = {
  tagging: validateTagMode as ModeValidator<any>
}

export type BattleEngine = {
  validateRound: (payload: RoundPayload) => ValidationResult
}

// Engine entrypoint for UI mode payloads.
// UI should submit interactions to this API instead of invoking validators directly.
export const createBattleEngine = (
  validatorOverrides: ValidatorRegistry = {}
): BattleEngine => {
  const validators: ValidatorRegistry = {
    ...defaultValidators,
    ...validatorOverrides
  }

  const validateRound = (payload: RoundPayload): ValidationResult => {
    const validator = validators[payload.mode]
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

      return {
        correct: false,
        score: 0,
        mistakes: feedback.map((message) => formatValidationFeedbackMessage(message)),
        feedback
      }
    }

    return executeValidator(validator as ModeValidator<any>, payload.userInput, payload.sentence)
  }

  return {
    validateRound
  }
}
