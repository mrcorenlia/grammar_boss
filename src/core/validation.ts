import type {
  GameMode,
  Sentence,
  ValidationFeedbackMessage,
  ValidationResult
} from "./types"

// Shared validator contract for all gameplay modes.
// Every mode validator takes raw user input + the current sentence and returns
// the standard ValidationResult shape used by the engine.
export type ModeValidator<UserInput = unknown> = (
  userInput: UserInput,
  sentence: Sentence
) => ValidationResult

// Registry contract used by battleEngine to dispatch validation by mode.
// User input shapes differ per mode, so registry entries intentionally accept
// mode-specific input contracts via `any` at the dispatch boundary.
export type ValidatorRegistry = Partial<Record<GameMode, ModeValidator<any>>>

type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string")

const isValidationFeedbackMessage = (
  value: unknown
): value is ValidationFeedbackMessage => {
  if (!isRecord(value)) {
    return false
  }

  if (typeof value.code !== "string" || value.code.length === 0) {
    return false
  }

  if (value.level !== "error" && value.level !== "info") {
    return false
  }

  if (value.tokenId !== undefined && typeof value.tokenId !== "string") {
    return false
  }

  if (value.params !== undefined) {
    if (!isRecord(value.params)) {
      return false
    }

    for (const paramValue of Object.values(value.params)) {
      if (
        paramValue !== null &&
        typeof paramValue !== "string" &&
        typeof paramValue !== "number" &&
        typeof paramValue !== "boolean"
      ) {
        return false
      }
    }
  }

  return true
}

// Runtime guard for cross-module safety.
// TypeScript enforces compile-time contracts, but this catches malformed
// values from future dynamic integrations or unsafe casts.
export const isValidationResult = (value: unknown): value is ValidationResult => {
  if (!isRecord(value)) {
    return false
  }

  if (typeof value.correct !== "boolean") {
    return false
  }

  if (typeof value.score !== "number" || !Number.isFinite(value.score)) {
    return false
  }

  if (!isStringArray(value.mistakes)) {
    return false
  }

  if (value.feedback !== undefined) {
    if (
      !Array.isArray(value.feedback) ||
      !value.feedback.every((item) => isValidationFeedbackMessage(item))
    ) {
      return false
    }
  }

  if (value.breakdown !== undefined) {
    if (!isRecord(value.breakdown)) {
      return false
    }
  }

  return true
}

// Asserts and returns a normalized ValidationResult.
// This standardizes validator output shape before battleEngine consumes it.
export const assertValidationResult = (value: unknown): ValidationResult => {
  if (!isValidationResult(value)) {
    throw new Error(
      "Validator output must match ValidationResult: { correct:boolean, score:number, mistakes:string[], feedback?:ValidationFeedbackMessage[], breakdown?:Record<string, unknown> }."
    )
  }

  const normalized: ValidationResult = {
    correct: value.correct,
    score: value.score,
    mistakes: [...value.mistakes]
  }

  if (value.feedback !== undefined) {
    normalized.feedback = value.feedback.map((message) => {
      const normalizedMessage: ValidationFeedbackMessage = {
        code: message.code,
        level: message.level
      }

      if (message.tokenId !== undefined) {
        normalizedMessage.tokenId = message.tokenId
      }

      if (message.params !== undefined) {
        normalizedMessage.params = { ...message.params }
      }

      return normalizedMessage
    })
  }

  if (value.breakdown !== undefined) {
    normalized.breakdown = { ...value.breakdown }
  }

  return normalized
}

type ObjectLike = Record<PropertyKey, unknown> | unknown[]

const isObjectLike = (value: unknown): value is ObjectLike =>
  typeof value === "object" && value !== null

const deepFreeze = <T>(value: T, seen = new WeakSet<object>()): T => {
  if (!isObjectLike(value)) {
    return value
  }

  if (seen.has(value as object)) {
    return value
  }

  seen.add(value as object)

  if (Array.isArray(value)) {
    for (const item of value) {
      deepFreeze(item, seen)
    }
  } else {
    for (const nestedValue of Object.values(value)) {
      deepFreeze(nestedValue, seen)
    }
  }

  return Object.freeze(value)
}

const cloneAndFreeze = <T>(value: T, label: string): T => {
  try {
    return deepFreeze(structuredClone(value))
  } catch {
    throw new Error(`Validator ${label} must be structured-cloneable.`)
  }
}

// Runs a validator under contract enforcement:
// 1) input args are cloned + deeply frozen (mutation attempts throw)
// 2) output is validated and normalized to ValidationResult
export const executeValidator = <UserInput>(
  validator: ModeValidator<UserInput>,
  userInput: UserInput,
  sentence: Sentence
): ValidationResult => {
  const frozenInput = cloneAndFreeze(userInput, "userInput")
  const frozenSentence = cloneAndFreeze(sentence, "sentence")
  const result = validator(frozenInput, frozenSentence)
  return assertValidationResult(result)
}
