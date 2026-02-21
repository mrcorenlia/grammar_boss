import type { GameMode, Sentence, ValidationResult } from "./types"
import type { TagModeUserInput } from "./validateTagMode"
import { validateTagMode } from "./validateTagMode"
import { executeValidator, type ModeValidator, type ValidatorRegistry } from "./validation"

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
      return {
        correct: false,
        score: 0,
        mistakes: [`No validator registered for mode "${payload.mode}".`]
      }
    }

    return executeValidator(validator as ModeValidator<any>, payload.userInput, payload.sentence)
  }

  return {
    validateRound
  }
}
