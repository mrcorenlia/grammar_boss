import type { ComboState } from "./types"

const DEFAULT_MAX_MULTIPLIER = 3

const toPositiveInteger = (value: unknown, fallback: number): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback
  }

  return Math.max(1, Math.trunc(value))
}

const toNonNegativeInteger = (value: unknown, fallback = 0): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback
  }

  return Math.max(0, Math.trunc(value))
}

// Combo progression starts at 1x and increases by +1 per fully correct round.
// The multiplier is capped by maxMultiplier.
export const calculateComboMultiplier = (
  comboCount: number,
  maxMultiplier = DEFAULT_MAX_MULTIPLIER
): number => {
  const normalizedCount = toNonNegativeInteger(comboCount)
  const normalizedMax = toPositiveInteger(maxMultiplier, DEFAULT_MAX_MULTIPLIER)
  return Math.min(1 + normalizedCount, normalizedMax)
}

// Stable factory for a new combo state record.
export const createInitialComboState = (
  maxMultiplier = DEFAULT_MAX_MULTIPLIER
): ComboState => {
  const normalizedMax = toPositiveInteger(maxMultiplier, DEFAULT_MAX_MULTIPLIER)

  return {
    comboCount: 0,
    multiplier: 1,
    maxMultiplier: normalizedMax
  }
}

// Updates combo based on round correctness.
// - fully correct round: comboCount + 1
// - incorrect round: comboCount reset to 0
// The returned state is a fresh object and never mutates the input state.
export const updateComboState = (
  previous: ComboState,
  roundFullyCorrect: boolean
): ComboState => {
  const normalizedMax = toPositiveInteger(
    previous.maxMultiplier,
    DEFAULT_MAX_MULTIPLIER
  )
  const nextCount = roundFullyCorrect
    ? toNonNegativeInteger(previous.comboCount) + 1
    : 0

  return {
    comboCount: nextCount,
    multiplier: calculateComboMultiplier(nextCount, normalizedMax),
    maxMultiplier: normalizedMax
  }
}
