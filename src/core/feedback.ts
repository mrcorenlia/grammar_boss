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

  if (feedback.code === "structure.incorrect_part_selection") {
    const partId = readStringParam(feedback.params, "partId") ?? "unknown"
    const expectedTokenIds =
      readStringParam(feedback.params, "expectedTokenIds") ?? "(none)"
    const receivedTokenIds =
      readStringParam(feedback.params, "receivedTokenIds") ?? "(none)"
    return `Incorrect ${partId} selection: expected [${expectedTokenIds}], received [${receivedTokenIds}].`
  }

  if (feedback.code === "structure.unknown_token") {
    const partId = readStringParam(feedback.params, "partId") ?? "unknown"
    const tokenId = readStringParam(feedback.params, "tokenId") ?? "unknown"
    return `Received structure token id "${tokenId}" for part "${partId}" that does not exist in the sentence.`
  }

  if (feedback.code === "gn-link.missing_link") {
    const dependentId = readStringParam(feedback.params, "dependentId") ?? "unknown"
    const expectedNounId =
      readStringParam(feedback.params, "expectedNounId") ?? "unknown"
    const linkKind = readStringParam(feedback.params, "linkKind") ?? "dependent"
    return `Missing ${linkKind} link for token "${dependentId}"; expected noun "${expectedNounId}".`
  }

  if (feedback.code === "gn-link.incorrect_link") {
    const dependentId = readStringParam(feedback.params, "dependentId") ?? "unknown"
    const expectedNounId =
      readStringParam(feedback.params, "expectedNounId") ?? "unknown"
    const receivedNounId =
      readStringParam(feedback.params, "receivedNounId") ?? "unknown"
    const linkKind = readStringParam(feedback.params, "linkKind") ?? "dependent"
    return `Incorrect ${linkKind} link for token "${dependentId}": expected noun "${expectedNounId}", received "${receivedNounId}".`
  }

  if (feedback.code === "gn-link.unknown_dependent") {
    const dependentId = readStringParam(feedback.params, "dependentId") ?? "unknown"
    return `Received GN link for unknown dependent token id "${dependentId}".`
  }

  if (feedback.code === "gn-link.unknown_noun") {
    const dependentId = readStringParam(feedback.params, "dependentId") ?? "unknown"
    const receivedNounId =
      readStringParam(feedback.params, "receivedNounId") ?? "unknown"
    return `Received GN link target "${receivedNounId}" for token "${dependentId}" that is not a noun in this sentence.`
  }

  if (feedback.code === "agreement.missing_gender") {
    const nounText = readStringParam(feedback.params, "nounText") ?? "noun"
    const nounId = readStringParam(feedback.params, "nounId") ?? "unknown"
    const expectedGender =
      readStringParam(feedback.params, "expectedGender") ?? "unknown"
    return `Missing gender for noun "${nounText}" (${nounId}); expected ${expectedGender}.`
  }

  if (feedback.code === "agreement.missing_number") {
    const nounText = readStringParam(feedback.params, "nounText") ?? "noun"
    const nounId = readStringParam(feedback.params, "nounId") ?? "unknown"
    const expectedNumber =
      readStringParam(feedback.params, "expectedNumber") ?? "unknown"
    return `Missing number for noun "${nounText}" (${nounId}); expected ${expectedNumber}.`
  }

  if (feedback.code === "agreement.incorrect_gender") {
    const nounText = readStringParam(feedback.params, "nounText") ?? "noun"
    const nounId = readStringParam(feedback.params, "nounId") ?? "unknown"
    const expectedGender =
      readStringParam(feedback.params, "expectedGender") ?? "unknown"
    const receivedGender =
      readStringParam(feedback.params, "receivedGender") ?? "unknown"
    return `Incorrect gender for noun "${nounText}" (${nounId}): expected ${expectedGender}, received ${receivedGender}.`
  }

  if (feedback.code === "agreement.incorrect_number") {
    const nounText = readStringParam(feedback.params, "nounText") ?? "noun"
    const nounId = readStringParam(feedback.params, "nounId") ?? "unknown"
    const expectedNumber =
      readStringParam(feedback.params, "expectedNumber") ?? "unknown"
    const receivedNumber =
      readStringParam(feedback.params, "receivedNumber") ?? "unknown"
    return `Incorrect number for noun "${nounText}" (${nounId}): expected ${expectedNumber}, received ${receivedNumber}.`
  }

  if (feedback.code === "agreement.unknown_noun") {
    const nounId = readStringParam(feedback.params, "nounId") ?? "unknown"
    return `Received agreement data for unknown noun id "${nounId}".`
  }

  if (feedback.code === "engine.unregistered_mode") {
    const mode = readStringParam(feedback.params, "mode") ?? "unknown"
    return `No validator registered for mode "${mode}".`
  }

  if (feedback.code === "engine.no_eligible_interactions") {
    return "No eligible interactions remain for this sentence in the current mode."
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
