import type { ModeValidator } from "./validation"
import type {
  PartOfSpeech,
  ValidationFeedbackMessage,
  ValidationInteractionOutcome
} from "./types"
import { formatValidationFeedbackMessage } from "./feedback"

// Input contract for POS tagging mode.
// Keys are token ids and values are the player's selected POS labels.
export type TagModeUserInput = {
  tokenIdToPOS: Record<string, string>
  eligibleTokenIds?: string[]
}

type TagTokenCheck = {
  tokenId: string
  tokenText: string
  expectedPOS: PartOfSpeech
  receivedPOS: string | null
  correct: boolean
}

const normalizePOS = (value: string): string => value.trim().toUpperCase()

// POS validator for tagging mode.
// Deterministic rules:
// - +1 score for each correctly tagged token
// - round is correct only when every sentence token is correctly tagged
// - missing, incorrect, and unexpected token tags are reported in mistakes
export const validateTagMode: ModeValidator<TagModeUserInput> = (userInput, sentence) => {
  const tokenIdToPOS = userInput.tokenIdToPOS
  const sentenceTokenIds = new Set(sentence.tokens.map((token) => token.id))
  const eligibleTokenIdSet = userInput.eligibleTokenIds
    ? new Set(userInput.eligibleTokenIds.filter((tokenId) => sentenceTokenIds.has(tokenId)))
    : sentenceTokenIds
  const tokensToEvaluate = sentence.tokens.filter((token) =>
    eligibleTokenIdSet.has(token.id)
  )
  const tokenChecks: TagTokenCheck[] = []
  const interactionOutcomes: ValidationInteractionOutcome[] = []
  const feedback: ValidationFeedbackMessage[] = []
  let correctTokenCount = 0
  let missingTokenCount = 0
  let incorrectTokenCount = 0

  for (const token of tokensToEvaluate) {
    const rawReceived = tokenIdToPOS[token.id]
    if (typeof rawReceived !== "string" || rawReceived.trim().length === 0) {
      missingTokenCount += 1
      tokenChecks.push({
        tokenId: token.id,
        tokenText: token.text,
        expectedPOS: token.partOfSpeech,
        receivedPOS: null,
        correct: false
      })
      feedback.push({
        code: "tagging.missing_pos",
        level: "error",
        tokenId: token.id,
        params: {
          tokenId: token.id,
          tokenText: token.text,
          expectedPOS: token.partOfSpeech
        }
      })
      interactionOutcomes.push({
        mode: "tagging" as const,
        sentenceId: sentence.id,
        interactionId: token.id,
        dimension: "partOfSpeech",
        expected: token.partOfSpeech,
        received: null,
        correct: false
      })
      continue
    }

    const receivedPOS = normalizePOS(rawReceived)
    const isCorrect = receivedPOS === token.partOfSpeech
    if (isCorrect) {
      correctTokenCount += 1
    } else {
      incorrectTokenCount += 1
      feedback.push({
        code: "tagging.incorrect_pos",
        level: "error",
        tokenId: token.id,
        params: {
          tokenId: token.id,
          tokenText: token.text,
          expectedPOS: token.partOfSpeech,
          receivedPOS
        }
      })
    }

    tokenChecks.push({
      tokenId: token.id,
      tokenText: token.text,
      expectedPOS: token.partOfSpeech,
      receivedPOS,
      correct: isCorrect
    })
    interactionOutcomes.push({
      mode: "tagging" as const,
      sentenceId: sentence.id,
      interactionId: token.id,
      dimension: "partOfSpeech",
      expected: token.partOfSpeech,
      received: receivedPOS,
      correct: isCorrect
    })
  }

  const unexpectedTokenIds = Object.keys(tokenIdToPOS)
    .filter((tokenId) => !sentenceTokenIds.has(tokenId))
    .sort()

  for (const tokenId of unexpectedTokenIds) {
    feedback.push({
      code: "tagging.unknown_token",
      level: "error",
      tokenId,
      params: {
        tokenId
      }
    })
  }

  const totalTokens = tokensToEvaluate.length
  const taggedTokenCount = tokensToEvaluate.filter((token) => {
    const value = tokenIdToPOS[token.id]
    return typeof value === "string" && value.trim().length > 0
  }).length
  const score = correctTokenCount
  const mistakes = feedback.map((message) => formatValidationFeedbackMessage(message))

  return {
    correct: feedback.length === 0 && correctTokenCount === totalTokens,
    score,
    mistakes,
    feedback,
    interactionOutcomes,
    breakdown: {
      mode: "tagging",
      sentenceTokenCount: sentence.tokens.length,
      eligibleTokenCount: totalTokens,
      totalTokens,
      taggedTokenCount,
      correctTokenCount,
      incorrectTokenCount,
      missingTokenCount,
      unexpectedTokenCount: unexpectedTokenIds.length,
      tokenChecks
    }
  }
}
