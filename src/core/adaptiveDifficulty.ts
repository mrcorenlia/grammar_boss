import type { PlayerStats, Sentence, StatsBucket } from "./types"

type AdaptiveSentenceSelectionInput = {
  sentences: Sentence[]
  currentSentenceIndex: number
  playerStats: PlayerStats
}

const DEFAULT_UNSEEN_TAG_WEAKNESS = 0.35
const DEFAULT_MIN_WEIGHT = 1

const getTagAccuracy = (bucket: StatsBucket | undefined): number | null => {
  if (!bucket || bucket.attempts <= 0) {
    return null
  }

  return bucket.correct / bucket.attempts
}

const calculateTagWeakness = (
  bucket: StatsBucket | undefined,
  unseenTagWeakness = DEFAULT_UNSEEN_TAG_WEAKNESS
): number => {
  const accuracy = getTagAccuracy(bucket)
  if (accuracy === null) {
    return unseenTagWeakness
  }

  return 1 - accuracy
}

const normalizeSentenceTags = (sentence: Sentence): string[] => {
  const tags = new Set<string>()
  for (const tag of sentence.tags) {
    const normalizedTag = tag.trim().toLowerCase()
    if (normalizedTag.length > 0) {
      tags.add(normalizedTag)
    }
  }

  return Array.from(tags)
}

const average = (values: number[]): number =>
  values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0

const toSafeSentenceIndex = (index: number, sentenceCount: number): number => {
  if (sentenceCount <= 0) {
    return -1
  }

  const normalized = Math.trunc(index)
  if (!Number.isFinite(normalized)) {
    return 0
  }

  return ((normalized % sentenceCount) + sentenceCount) % sentenceCount
}

const getForwardDistance = (
  fromIndex: number,
  toIndex: number,
  sentenceCount: number
): number => {
  if (sentenceCount <= 0) {
    return 0
  }

  return ((toIndex - fromIndex) % sentenceCount + sentenceCount) % sentenceCount
}

// Returns a deterministic sentence weight based on weak-tag coverage.
// Higher weights indicate better candidates for adaptive practice.
export const calculateAdaptiveSentenceWeight = (
  sentence: Sentence,
  playerStats: PlayerStats
): number => {
  const normalizedTags = normalizeSentenceTags(sentence)
  if (normalizedTags.length === 0) {
    return DEFAULT_MIN_WEIGHT
  }

  const weakTagWeights = normalizedTags.map((tag) =>
    calculateTagWeakness(playerStats.byTag[tag])
  )

  // Add a small difficulty nudge so harder content appears as skill improves.
  const difficultyNudge = sentence.difficulty / 100
  return DEFAULT_MIN_WEIGHT + average(weakTagWeights) + difficultyNudge
}

// Selects the next sentence index using adaptive weak-tag weighting.
// Deterministic tie-breaking keeps behavior stable in tests and gameplay.
export const selectAdaptiveSentenceIndex = ({
  sentences,
  currentSentenceIndex,
  playerStats
}: AdaptiveSentenceSelectionInput): number => {
  if (sentences.length === 0) {
    return -1
  }
  if (sentences.length === 1) {
    return 0
  }

  const safeCurrentIndex = toSafeSentenceIndex(currentSentenceIndex, sentences.length)
  const candidateIndexes = sentences
    .map((_, index) => index)
    .filter((index) => index !== safeCurrentIndex)

  let bestIndex = candidateIndexes[0] ?? 0
  let bestWeight = Number.NEGATIVE_INFINITY
  let bestDistance = Number.POSITIVE_INFINITY

  for (const candidateIndex of candidateIndexes) {
    const sentence = sentences[candidateIndex]
    if (!sentence) {
      continue
    }

    const weight = calculateAdaptiveSentenceWeight(sentence, playerStats)
    const distance = getForwardDistance(
      safeCurrentIndex,
      candidateIndex,
      sentences.length
    )

    if (
      weight > bestWeight ||
      (weight === bestWeight && distance < bestDistance) ||
      (weight === bestWeight && distance === bestDistance && candidateIndex < bestIndex)
    ) {
      bestIndex = candidateIndex
      bestWeight = weight
      bestDistance = distance
    }
  }

  return bestIndex
}
