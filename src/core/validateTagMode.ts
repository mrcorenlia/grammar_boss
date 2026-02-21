import type { ModeValidator } from "./validation"
import type { PartOfSpeech } from "./types"

// Input contract for POS tagging mode.
// Keys are token ids and values are the player's selected POS labels.
export type TagModeUserInput = {
  tokenIdToPOS: Record<string, string>
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
  const tokenIds = new Set(sentence.tokens.map((token) => token.id))
  const tokenChecks: TagTokenCheck[] = []
  const mistakes: string[] = []
  let correctTokenCount = 0
  let missingTokenCount = 0
  let incorrectTokenCount = 0

  for (const token of sentence.tokens) {
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
      mistakes.push(
        `Missing POS tag for token "${token.text}" (${token.id}); expected ${token.partOfSpeech}.`
      )
      continue
    }

    const receivedPOS = normalizePOS(rawReceived)
    const isCorrect = receivedPOS === token.partOfSpeech
    if (isCorrect) {
      correctTokenCount += 1
    } else {
      incorrectTokenCount += 1
      mistakes.push(
        `Incorrect POS tag for token "${token.text}" (${token.id}): expected ${token.partOfSpeech}, received ${receivedPOS}.`
      )
    }

    tokenChecks.push({
      tokenId: token.id,
      tokenText: token.text,
      expectedPOS: token.partOfSpeech,
      receivedPOS,
      correct: isCorrect
    })
  }

  const unexpectedTokenIds = Object.keys(tokenIdToPOS)
    .filter((tokenId) => !tokenIds.has(tokenId))
    .sort()

  for (const tokenId of unexpectedTokenIds) {
    mistakes.push(`Received POS tag for unknown token id "${tokenId}".`)
  }

  const totalTokens = sentence.tokens.length
  const taggedTokenCount = Object.values(tokenIdToPOS).filter(
    (value) => typeof value === "string" && value.trim().length > 0
  ).length
  const score = correctTokenCount

  return {
    correct: mistakes.length === 0 && correctTokenCount === totalTokens,
    score,
    mistakes,
    breakdown: {
      mode: "tagging",
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
