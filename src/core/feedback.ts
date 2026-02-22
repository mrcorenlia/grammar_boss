import type { ValidationFeedbackMessage, ValidationResult } from "./types"

const readStringParam = (
  params: ValidationFeedbackMessage["params"],
  key: string
): string | null => {
  const value = params?.[key]
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value)
  }
  return null
}

// Converts structured core feedback into default display text.
// UI can replace this formatter in later iterations for custom copy/localization.
export const formatValidationFeedbackMessage = (
  feedback: ValidationFeedbackMessage
): string => {
  if (feedback.code === "tagging.missing_pos") {
    const tokenText = readStringParam(feedback.params, "tokenText") ?? "token"
    const tokenId = readStringParam(feedback.params, "tokenId") ?? "unknown"
    const expectedPOS = readStringParam(feedback.params, "expectedPOS") ?? "unknown"
    return `Missing POS tag for token "${tokenText}" (${tokenId}); expected ${expectedPOS}.`
  }

  if (feedback.code === "tagging.incorrect_pos") {
    const tokenText = readStringParam(feedback.params, "tokenText") ?? "token"
    const tokenId = readStringParam(feedback.params, "tokenId") ?? "unknown"
    const expectedPOS = readStringParam(feedback.params, "expectedPOS") ?? "unknown"
    const receivedPOS = readStringParam(feedback.params, "receivedPOS") ?? "unknown"
    return `Incorrect POS tag for token "${tokenText}" (${tokenId}): expected ${expectedPOS}, received ${receivedPOS}.`
  }

  if (feedback.code === "tagging.unknown_token") {
    const tokenId = readStringParam(feedback.params, "tokenId") ?? "unknown"
    return `Received POS tag for unknown token id "${tokenId}".`
  }

  if (feedback.code === "engine.unregistered_mode") {
    const mode = readStringParam(feedback.params, "mode") ?? "unknown"
    return `No validator registered for mode "${mode}".`
  }

  const explicitMessage = readStringParam(feedback.params, "message")
  if (explicitMessage) {
    return explicitMessage
  }

  return feedback.code
}

// Normalized mistake extraction:
// - prefer structured feedback when available
// - fall back to legacy mistakes strings for older validators
export const getValidationMistakeMessages = (result: ValidationResult): string[] => {
  if (result.feedback && result.feedback.length > 0) {
    return result.feedback
      .filter((message) => message.level === "error")
      .map((message) => formatValidationFeedbackMessage(message))
  }

  return [...result.mistakes]
}
