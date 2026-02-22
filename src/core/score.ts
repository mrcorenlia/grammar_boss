// Defaults can be tuned later without changing score call sites.
const DEFAULT_BASE_POINTS_PER_CORRECT = 10

const toNonNegativeInteger = (value: unknown, fallback = 0): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback
  }

  return Math.max(0, Math.trunc(value))
}

const normalizeElapsedMs = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null
  }

  return Math.max(0, Math.trunc(value))
}

// Speed bonus hook context passed from score calculation.
// This keeps the score module deterministic while allowing UI/engine layers
// to plug in custom timing policies in later iterations.
export type SpeedBonusHookContext = {
  correctInteractionCount: number
  basePointsPerCorrect: number
  baseScore: number
  elapsedMs: number | null
}

// Optional callback contract for score bonus policies.
// Return value is normalized to a non-negative integer.
export type SpeedBonusHook = (context: SpeedBonusHookContext) => number

export type RoundScoreInput = {
  correctInteractionCount: number
  basePointsPerCorrect?: number
  elapsedMs?: number | null
  speedBonusHook?: SpeedBonusHook
}

export type RoundScoreResult = {
  baseScore: number
  speedBonus: number
  totalScore: number
}

// Base score rule:
// points = correct_interactions * base_points_per_correct
export const calculateBaseScore = (
  correctInteractionCount: number,
  basePointsPerCorrect = DEFAULT_BASE_POINTS_PER_CORRECT
): number => {
  const normalizedCorrectCount = toNonNegativeInteger(correctInteractionCount)
  const normalizedBasePoints = toNonNegativeInteger(
    basePointsPerCorrect,
    DEFAULT_BASE_POINTS_PER_CORRECT
  )

  return normalizedCorrectCount * normalizedBasePoints
}

// Round score combines base score and an optional speed bonus hook.
// No internal state is used, so repeated calls with the same input are stable.
export const calculateRoundScore = (input: RoundScoreInput): RoundScoreResult => {
  const normalizedCorrectCount = toNonNegativeInteger(input.correctInteractionCount)
  const normalizedBasePoints = toNonNegativeInteger(
    input.basePointsPerCorrect,
    DEFAULT_BASE_POINTS_PER_CORRECT
  )
  const baseScore = normalizedCorrectCount * normalizedBasePoints
  const elapsedMs = normalizeElapsedMs(input.elapsedMs)

  const rawSpeedBonus = input.speedBonusHook
    ? input.speedBonusHook({
        correctInteractionCount: normalizedCorrectCount,
        basePointsPerCorrect: normalizedBasePoints,
        baseScore,
        elapsedMs
      })
    : 0

  const speedBonus = toNonNegativeInteger(rawSpeedBonus)
  const totalScore = baseScore + speedBonus

  return {
    baseScore,
    speedBonus,
    totalScore
  }
}
