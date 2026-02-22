import type {
  Sentence,
  ValidationFeedbackMessage,
  ValidationInteractionOutcome
} from "./types"
import type { ModeValidator } from "./validation"
import { formatValidationFeedbackMessage } from "./feedback"

export type StructurePartId = "subject" | "predicate" | "complement"

export type StructureModeUserInput = {
  subjectTokenIds: string[]
  predicateTokenIds: string[]
  complementTokenIds?: string[]
  eligiblePartIds?: StructurePartId[]
}

type PartCheck = {
  partId: StructurePartId
  applicable: boolean
  eligible: boolean
  expectedTokenIds: string[]
  receivedTokenIds: string[]
  correct: boolean
}

const ALL_PART_IDS: StructurePartId[] = ["subject", "predicate", "complement"]

const isStructurePartId = (value: string): value is StructurePartId =>
  value === "subject" || value === "predicate" || value === "complement"

const normalizeTokenIdsToSentenceOrder = (
  value: unknown,
  sentence: Sentence
): { tokenIds: string[]; unknownTokenIds: string[] } => {
  const knownTokenIds = new Set(sentence.tokens.map((token) => token.id))
  const selectedTokenIds = new Set<string>()
  const unknownTokenIds = new Set<string>()

  if (Array.isArray(value)) {
    for (const tokenId of value) {
      if (typeof tokenId !== "string") {
        continue
      }

      if (knownTokenIds.has(tokenId)) {
        selectedTokenIds.add(tokenId)
      } else {
        unknownTokenIds.add(tokenId)
      }
    }
  }

  const tokenIds = sentence.tokens
    .map((token) => token.id)
    .filter((tokenId) => selectedTokenIds.has(tokenId))

  return {
    tokenIds,
    unknownTokenIds: Array.from(unknownTokenIds).sort()
  }
}

const serializeTokenIdSet = (tokenIds: string[]): string => tokenIds.join("|")

const normalizeEligiblePartIds = (
  rawEligiblePartIds: unknown,
  hasComplement: boolean
): StructurePartId[] => {
  const defaultPartIds: StructurePartId[] = hasComplement
    ? ["subject", "predicate", "complement"]
    : ["subject", "predicate"]

  if (!Array.isArray(rawEligiblePartIds)) {
    return defaultPartIds
  }

  const seenPartIds = new Set<StructurePartId>()
  for (const value of rawEligiblePartIds) {
    if (typeof value !== "string" || !isStructurePartId(value)) {
      continue
    }

    if (value === "complement" && !hasComplement) {
      continue
    }

    seenPartIds.add(value)
  }

  return defaultPartIds.filter((partId) => seenPartIds.has(partId))
}

// Structure validator evaluates sentence parts (subject/predicate/complement)
// as exact token-id set matches. The function is pure and deterministic.
export const validateStructureMode: ModeValidator<StructureModeUserInput> = (
  userInput,
  sentence
) => {
  const normalizedSubjectInput = normalizeTokenIdsToSentenceOrder(
    userInput.subjectTokenIds,
    sentence
  )
  const normalizedPredicateInput = normalizeTokenIdsToSentenceOrder(
    userInput.predicateTokenIds,
    sentence
  )
  const normalizedComplementInput = normalizeTokenIdsToSentenceOrder(
    userInput.complementTokenIds ?? [],
    sentence
  )

  const expectedSubjectTokenIds = normalizeTokenIdsToSentenceOrder(
    sentence.structure.subjectTokenIds,
    sentence
  ).tokenIds
  const expectedPredicateTokenIds = normalizeTokenIdsToSentenceOrder(
    sentence.structure.predicateTokenIds,
    sentence
  ).tokenIds
  const expectedComplementTokenIds = normalizeTokenIdsToSentenceOrder(
    sentence.structure.complementTokenIds ?? [],
    sentence
  ).tokenIds
  const hasComplement = expectedComplementTokenIds.length > 0
  const eligiblePartIds = normalizeEligiblePartIds(userInput.eligiblePartIds, hasComplement)
  const eligiblePartIdSet = new Set(eligiblePartIds)

  const unknownTokenIssues: Array<{ partId: StructurePartId; tokenId: string }> = []
  for (const tokenId of normalizedSubjectInput.unknownTokenIds) {
    unknownTokenIssues.push({ partId: "subject", tokenId })
  }
  for (const tokenId of normalizedPredicateInput.unknownTokenIds) {
    unknownTokenIssues.push({ partId: "predicate", tokenId })
  }
  for (const tokenId of normalizedComplementInput.unknownTokenIds) {
    unknownTokenIssues.push({ partId: "complement", tokenId })
  }

  const partChecks: PartCheck[] = [
    {
      partId: "subject",
      applicable: true,
      eligible: eligiblePartIdSet.has("subject"),
      expectedTokenIds: expectedSubjectTokenIds,
      receivedTokenIds: normalizedSubjectInput.tokenIds,
      correct:
        serializeTokenIdSet(expectedSubjectTokenIds) ===
        serializeTokenIdSet(normalizedSubjectInput.tokenIds)
    },
    {
      partId: "predicate",
      applicable: true,
      eligible: eligiblePartIdSet.has("predicate"),
      expectedTokenIds: expectedPredicateTokenIds,
      receivedTokenIds: normalizedPredicateInput.tokenIds,
      correct:
        serializeTokenIdSet(expectedPredicateTokenIds) ===
        serializeTokenIdSet(normalizedPredicateInput.tokenIds)
    },
    {
      partId: "complement",
      applicable: hasComplement,
      eligible: hasComplement && eligiblePartIdSet.has("complement"),
      expectedTokenIds: expectedComplementTokenIds,
      receivedTokenIds: normalizedComplementInput.tokenIds,
      correct:
        serializeTokenIdSet(expectedComplementTokenIds) ===
        serializeTokenIdSet(normalizedComplementInput.tokenIds)
    }
  ]

  const feedback: ValidationFeedbackMessage[] = []
  for (const issue of unknownTokenIssues) {
    feedback.push({
      code: "structure.unknown_token",
      level: "error",
      tokenId: issue.tokenId,
      params: {
        partId: issue.partId,
        tokenId: issue.tokenId
      }
    })
  }

  for (const partCheck of partChecks) {
    if (!partCheck.eligible || partCheck.correct) {
      continue
    }

    feedback.push({
      code: "structure.incorrect_part_selection",
      level: "error",
      params: {
        partId: partCheck.partId,
        expectedTokenIds: serializeTokenIdSet(partCheck.expectedTokenIds),
        receivedTokenIds: serializeTokenIdSet(partCheck.receivedTokenIds)
      }
    })
  }

  const interactionOutcomes: ValidationInteractionOutcome[] = partChecks
    .filter((partCheck) => partCheck.eligible)
    .map((partCheck) => ({
      mode: "structure",
      sentenceId: sentence.id,
      interactionId: partCheck.partId,
      dimension: "sentenceStructurePart",
      expected: serializeTokenIdSet(partCheck.expectedTokenIds),
      received: serializeTokenIdSet(partCheck.receivedTokenIds),
      correct: partCheck.correct
    }))

  const score = partChecks.filter((partCheck) => partCheck.eligible && partCheck.correct).length
  const eligiblePartCount = partChecks.filter((partCheck) => partCheck.eligible).length
  const correct = feedback.length === 0 && score === eligiblePartCount

  return {
    correct,
    score,
    mistakes: feedback.map((message) => formatValidationFeedbackMessage(message)),
    feedback,
    interactionOutcomes,
    breakdown: {
      mode: "structure",
      applicablePartIds: partChecks
        .filter((partCheck) => partCheck.applicable)
        .map((partCheck) => partCheck.partId),
      eligiblePartIds,
      correctPartCount: score,
      eligiblePartCount,
      unknownTokenIssueCount: unknownTokenIssues.length,
      partChecks
    }
  }
}
