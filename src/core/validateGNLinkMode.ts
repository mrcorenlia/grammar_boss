import type {
  Sentence,
  ValidationFeedbackMessage,
  ValidationInteractionOutcome
} from "./types"
import type { ModeValidator } from "./validation"
import { formatValidationFeedbackMessage } from "./feedback"

export type GNLinkKind = "determiner" | "adjective"

export type GNLinkModeUserInput = {
  dependentIdToNounId: Record<string, string>
  eligibleLinkIds?: string[]
}

type GNLinkExpectation = {
  interactionId: string
  dependentId: string
  expectedNounId: string
  kind: GNLinkKind
}

type GNLinkCheck = {
  interactionId: string
  dependentId: string
  expectedNounId: string
  receivedNounId: string | null
  kind: GNLinkKind
  correct: boolean
}

const listGNLinkExpectations = (sentence: Sentence): GNLinkExpectation[] => {
  const expectedByDependentId = new Map<string, GNLinkExpectation>()

  for (const group of sentence.groups.gn) {
    if (group.determinerId) {
      expectedByDependentId.set(group.determinerId, {
        interactionId: group.determinerId,
        dependentId: group.determinerId,
        expectedNounId: group.nounId,
        kind: "determiner"
      })
    }

    for (const adjectiveId of group.adjectiveIds ?? []) {
      expectedByDependentId.set(adjectiveId, {
        interactionId: adjectiveId,
        dependentId: adjectiveId,
        expectedNounId: group.nounId,
        kind: "adjective"
      })
    }
  }

  return sentence.tokens.flatMap((token) => {
      const expectation = expectedByDependentId.get(token.id)
      return expectation ? [expectation] : []
    })
}

const normalizeEligibleLinkIds = (
  rawEligibleLinkIds: unknown,
  expectations: GNLinkExpectation[]
): string[] => {
  const defaultLinkIds = expectations.map((expectation) => expectation.interactionId)
  if (!Array.isArray(rawEligibleLinkIds)) {
    return defaultLinkIds
  }

  const expectedIdSet = new Set(defaultLinkIds)
  const seen = new Set<string>()
  for (const value of rawEligibleLinkIds) {
    if (typeof value !== "string" || !expectedIdSet.has(value)) {
      continue
    }

    seen.add(value)
  }

  return defaultLinkIds.filter((linkId) => seen.has(linkId))
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0

// GN linking validator checks token->noun links for determiner and adjective tokens.
// Scoring is part-exact per eligible dependent token link (+1 each correct link).
export const validateGNLinkMode: ModeValidator<GNLinkModeUserInput> = (
  userInput,
  sentence
) => {
  const expectations = listGNLinkExpectations(sentence)
  const expectationById = new Map(
    expectations.map((expectation) => [expectation.interactionId, expectation])
  )
  const eligibleLinkIds = normalizeEligibleLinkIds(userInput.eligibleLinkIds, expectations)
  const eligibleLinkIdSet = new Set(eligibleLinkIds)
  const nounTokenIdSet = new Set(
    sentence.tokens
      .filter((token) => token.partOfSpeech === "NOUN")
      .map((token) => token.id)
  )

  const feedback: ValidationFeedbackMessage[] = []
  const checks: GNLinkCheck[] = []
  const interactionOutcomes: ValidationInteractionOutcome[] = []

  const unknownDependentIds = Object.keys(userInput.dependentIdToNounId)
    .filter((dependentId) => !expectationById.has(dependentId))
    .sort()

  for (const dependentId of unknownDependentIds) {
    feedback.push({
      code: "gn-link.unknown_dependent",
      level: "error",
      tokenId: dependentId,
      params: {
        dependentId
      }
    })
  }

  let correctLinkCount = 0
  let missingLinkCount = 0
  let incorrectLinkCount = 0
  let unknownNounCount = 0

  for (const expectation of expectations) {
    if (!eligibleLinkIdSet.has(expectation.interactionId)) {
      continue
    }

    const rawReceivedNounId = userInput.dependentIdToNounId[expectation.dependentId]
    if (!isNonEmptyString(rawReceivedNounId)) {
      missingLinkCount += 1
      checks.push({
        interactionId: expectation.interactionId,
        dependentId: expectation.dependentId,
        expectedNounId: expectation.expectedNounId,
        receivedNounId: null,
        kind: expectation.kind,
        correct: false
      })
      feedback.push({
        code: "gn-link.missing_link",
        level: "error",
        tokenId: expectation.dependentId,
        params: {
          dependentId: expectation.dependentId,
          expectedNounId: expectation.expectedNounId,
          linkKind: expectation.kind
        }
      })
      interactionOutcomes.push({
        mode: "gn-link",
        sentenceId: sentence.id,
        interactionId: expectation.interactionId,
        dimension: "gnLinkTarget",
        expected: expectation.expectedNounId,
        received: null,
        correct: false
      })
      continue
    }

    const receivedNounId = rawReceivedNounId.trim()
    if (!nounTokenIdSet.has(receivedNounId)) {
      unknownNounCount += 1
      checks.push({
        interactionId: expectation.interactionId,
        dependentId: expectation.dependentId,
        expectedNounId: expectation.expectedNounId,
        receivedNounId,
        kind: expectation.kind,
        correct: false
      })
      feedback.push({
        code: "gn-link.unknown_noun",
        level: "error",
        tokenId: expectation.dependentId,
        params: {
          dependentId: expectation.dependentId,
          receivedNounId,
          linkKind: expectation.kind
        }
      })
      interactionOutcomes.push({
        mode: "gn-link",
        sentenceId: sentence.id,
        interactionId: expectation.interactionId,
        dimension: "gnLinkTarget",
        expected: expectation.expectedNounId,
        received: receivedNounId,
        correct: false
      })
      continue
    }

    const correct = receivedNounId === expectation.expectedNounId
    if (correct) {
      correctLinkCount += 1
    } else {
      incorrectLinkCount += 1
      feedback.push({
        code: "gn-link.incorrect_link",
        level: "error",
        tokenId: expectation.dependentId,
        params: {
          dependentId: expectation.dependentId,
          expectedNounId: expectation.expectedNounId,
          receivedNounId,
          linkKind: expectation.kind
        }
      })
    }

    checks.push({
      interactionId: expectation.interactionId,
      dependentId: expectation.dependentId,
      expectedNounId: expectation.expectedNounId,
      receivedNounId,
      kind: expectation.kind,
      correct
    })
    interactionOutcomes.push({
      mode: "gn-link",
      sentenceId: sentence.id,
      interactionId: expectation.interactionId,
      dimension: "gnLinkTarget",
      expected: expectation.expectedNounId,
      received: receivedNounId,
      correct
    })
  }

  const score = correctLinkCount
  const correct = feedback.length === 0 && score === eligibleLinkIds.length

  return {
    correct,
    score,
    mistakes: feedback.map((message) => formatValidationFeedbackMessage(message)),
    feedback,
    interactionOutcomes,
    breakdown: {
      mode: "gn-link",
      totalExpectedLinkCount: expectations.length,
      eligibleLinkCount: eligibleLinkIds.length,
      correctLinkCount,
      missingLinkCount,
      incorrectLinkCount,
      unknownNounCount,
      unknownDependentCount: unknownDependentIds.length,
      eligibleLinkIds,
      checks
    }
  }
}
