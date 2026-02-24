import type {
  Sentence,
  ValidationFeedbackMessage,
  ValidationInteractionOutcome
} from "./types"
import type { ModeValidator } from "./validation"
import { formatValidationFeedbackMessage } from "./feedback"

export type AgreementGender = "m" | "f"
export type AgreementNumber = "s" | "p"

export type AgreementModeUserInput = {
  nounIdToGender: Record<string, string>
  nounIdToNumber: Record<string, string>
  eligibleNounIds?: string[]
}

type AgreementExpectation = {
  nounId: string
  nounText: string
  expectedGender: AgreementGender
  expectedNumber: AgreementNumber
}

type AgreementCheck = {
  nounId: string
  nounText: string
  expectedGender: AgreementGender
  expectedNumber: AgreementNumber
  receivedGender: AgreementGender | null
  receivedNumber: AgreementNumber | null
  correct: boolean
}

const toAgreementGender = (value: unknown): AgreementGender | null => {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim().toLowerCase()
  return normalized === "m" || normalized === "f" ? normalized : null
}

const toAgreementNumber = (value: unknown): AgreementNumber | null => {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim().toLowerCase()
  return normalized === "s" || normalized === "p" ? normalized : null
}

const listAgreementExpectations = (sentence: Sentence): AgreementExpectation[] =>
  sentence.tokens.flatMap((token) => {
    if (
      token.partOfSpeech !== "NOUN" ||
      (token.gender !== "m" && token.gender !== "f") ||
      (token.number !== "s" && token.number !== "p")
    ) {
      return []
    }

    return [
      {
        nounId: token.id,
        nounText: token.text,
        expectedGender: token.gender,
        expectedNumber: token.number
      }
    ]
  })

const normalizeEligibleNounIds = (
  rawEligibleNounIds: unknown,
  expectations: AgreementExpectation[]
): string[] => {
  const defaultNounIds = expectations.map((expectation) => expectation.nounId)
  if (!Array.isArray(rawEligibleNounIds)) {
    return defaultNounIds
  }

  const knownNounIdSet = new Set(defaultNounIds)
  const seenNounIds = new Set<string>()
  for (const nounId of rawEligibleNounIds) {
    if (typeof nounId !== "string" || !knownNounIdSet.has(nounId)) {
      continue
    }

    seenNounIds.add(nounId)
  }

  return defaultNounIds.filter((nounId) => seenNounIds.has(nounId))
}

const serializeAgreement = (gender: AgreementGender, number: AgreementNumber): string =>
  `${gender}|${number}`

// Agreement validator checks noun gender+number pairs from sentence content.
// Each eligible noun is one interaction worth +1 only when both values are correct.
export const validateAgreementMode: ModeValidator<AgreementModeUserInput> = (
  userInput,
  sentence
) => {
  const expectations = listAgreementExpectations(sentence)
  const eligibleNounIds = normalizeEligibleNounIds(userInput.eligibleNounIds, expectations)
  const eligibleNounIdSet = new Set(eligibleNounIds)
  const expectationByNounId = new Map(
    expectations.map((expectation) => [expectation.nounId, expectation])
  )

  const feedback: ValidationFeedbackMessage[] = []
  const checks: AgreementCheck[] = []
  const interactionOutcomes: ValidationInteractionOutcome[] = []

  const unknownNounIds = Array.from(
    new Set([
      ...Object.keys(userInput.nounIdToGender),
      ...Object.keys(userInput.nounIdToNumber)
    ])
  )
    .filter((nounId) => !expectationByNounId.has(nounId))
    .sort()

  for (const nounId of unknownNounIds) {
    feedback.push({
      code: "agreement.unknown_noun",
      level: "error",
      tokenId: nounId,
      params: {
        nounId
      }
    })
  }

  let correctNounCount = 0
  let missingGenderCount = 0
  let missingNumberCount = 0
  let incorrectGenderCount = 0
  let incorrectNumberCount = 0

  for (const expectation of expectations) {
    if (!eligibleNounIdSet.has(expectation.nounId)) {
      continue
    }

    const receivedGender = toAgreementGender(userInput.nounIdToGender[expectation.nounId])
    const receivedNumber = toAgreementNumber(userInput.nounIdToNumber[expectation.nounId])

    if (receivedGender === null) {
      missingGenderCount += 1
      feedback.push({
        code: "agreement.missing_gender",
        level: "error",
        tokenId: expectation.nounId,
        params: {
          nounId: expectation.nounId,
          nounText: expectation.nounText,
          expectedGender: expectation.expectedGender
        }
      })
    }

    if (receivedNumber === null) {
      missingNumberCount += 1
      feedback.push({
        code: "agreement.missing_number",
        level: "error",
        tokenId: expectation.nounId,
        params: {
          nounId: expectation.nounId,
          nounText: expectation.nounText,
          expectedNumber: expectation.expectedNumber
        }
      })
    }

    if (receivedGender !== null && receivedGender !== expectation.expectedGender) {
      incorrectGenderCount += 1
      feedback.push({
        code: "agreement.incorrect_gender",
        level: "error",
        tokenId: expectation.nounId,
        params: {
          nounId: expectation.nounId,
          nounText: expectation.nounText,
          expectedGender: expectation.expectedGender,
          receivedGender
        }
      })
    }

    if (receivedNumber !== null && receivedNumber !== expectation.expectedNumber) {
      incorrectNumberCount += 1
      feedback.push({
        code: "agreement.incorrect_number",
        level: "error",
        tokenId: expectation.nounId,
        params: {
          nounId: expectation.nounId,
          nounText: expectation.nounText,
          expectedNumber: expectation.expectedNumber,
          receivedNumber
        }
      })
    }

    const nounCorrect =
      receivedGender === expectation.expectedGender &&
      receivedNumber === expectation.expectedNumber

    if (nounCorrect) {
      correctNounCount += 1
    }

    checks.push({
      nounId: expectation.nounId,
      nounText: expectation.nounText,
      expectedGender: expectation.expectedGender,
      expectedNumber: expectation.expectedNumber,
      receivedGender,
      receivedNumber,
      correct: nounCorrect
    })

    interactionOutcomes.push({
      mode: "agreement",
      sentenceId: sentence.id,
      interactionId: expectation.nounId,
      dimension: "agreementGenderNumber",
      expected: serializeAgreement(expectation.expectedGender, expectation.expectedNumber),
      received:
        receivedGender !== null && receivedNumber !== null
          ? serializeAgreement(receivedGender, receivedNumber)
          : null,
      correct: nounCorrect
    })
  }

  const score = correctNounCount
  const correct = feedback.length === 0 && score === eligibleNounIds.length

  return {
    correct,
    score,
    mistakes: feedback.map((message) => formatValidationFeedbackMessage(message)),
    feedback,
    interactionOutcomes,
    breakdown: {
      mode: "agreement",
      totalExpectedNounCount: expectations.length,
      eligibleNounCount: eligibleNounIds.length,
      correctNounCount,
      missingGenderCount,
      missingNumberCount,
      incorrectGenderCount,
      incorrectNumberCount,
      unknownNounCount: unknownNounIds.length,
      eligibleNounIds,
      checks
    }
  }
}
