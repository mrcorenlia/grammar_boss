import type { BossDamageEvent } from "../boss/DamageSystem"

export type BossVisualState = {
  crackedPartIds: Record<string, true>
  explodingPartIds: Record<string, true>
  removedPartIds: Record<string, true>
  flashActive: boolean
  shakeActive: boolean
  lastProcessedRoundId: number
}

export type BossVisualRoundInput = {
  roundId: number
  events: BossDamageEvent[]
}

// Creates the animation-layer visual state for a fresh battle session.
export const createInitialBossVisualState = (): BossVisualState => ({
  crackedPartIds: {},
  explodingPartIds: {},
  removedPartIds: {},
  flashActive: false,
  shakeActive: false,
  lastProcessedRoundId: -1
})

// Returns unique damaged part ids from an engine event batch.
export const collectDamagedPartIds = (events: BossDamageEvent[]): string[] => {
  const ids = new Set<string>()

  for (const event of events) {
    if (event.type === "boss.part_damaged") {
      ids.add(event.partId)
    }
  }

  return Array.from(ids)
}

// Returns unique destroyed part ids from an engine event batch.
export const collectDestroyedPartIds = (events: BossDamageEvent[]): string[] => {
  const ids = new Set<string>()

  for (const event of events) {
    if (event.type === "boss.part_destroyed") {
      ids.add(event.partId)
    }
  }

  return Array.from(ids)
}

// Derives next visual state from a round event payload.
// Idempotency: the same roundId never mutates visual state twice.
export const deriveBossVisualState = (
  previousState: BossVisualState,
  input: BossVisualRoundInput
): BossVisualState => {
  if (input.roundId <= previousState.lastProcessedRoundId) {
    return previousState
  }

  const damagedPartIds = collectDamagedPartIds(input.events)
  const destroyedPartIds = collectDestroyedPartIds(input.events)
  const nextCrackedPartIds = { ...previousState.crackedPartIds }
  const nextExplodingPartIds = { ...previousState.explodingPartIds }
  for (const partId of damagedPartIds) {
    nextCrackedPartIds[partId] = true
  }
  for (const partId of destroyedPartIds) {
    nextCrackedPartIds[partId] = true
    if (!previousState.removedPartIds[partId]) {
      nextExplodingPartIds[partId] = true
    }
  }

  const hasDamage = damagedPartIds.length > 0

  return {
    crackedPartIds: nextCrackedPartIds,
    explodingPartIds: nextExplodingPartIds,
    removedPartIds: { ...previousState.removedPartIds },
    flashActive: hasDamage,
    shakeActive: hasDamage,
    lastProcessedRoundId: input.roundId
  }
}

// Marks one exploding part as removed after its explosion animation completes.
export const finalizePartExplosion = (
  previousState: BossVisualState,
  partId: string
): BossVisualState => {
  if (!previousState.explodingPartIds[partId]) {
    return previousState
  }

  const nextExplodingPartIds = { ...previousState.explodingPartIds }
  delete nextExplodingPartIds[partId]

  return {
    ...previousState,
    explodingPartIds: nextExplodingPartIds,
    removedPartIds: {
      ...previousState.removedPartIds,
      [partId]: true
    }
  }
}

// Completes all active explosions (used for reduced-motion behavior).
export const finalizeAllPartExplosions = (
  previousState: BossVisualState
): BossVisualState => {
  const explodingPartIds = Object.keys(previousState.explodingPartIds)
  if (explodingPartIds.length === 0) {
    return previousState
  }

  const nextRemovedPartIds = { ...previousState.removedPartIds }
  for (const partId of explodingPartIds) {
    nextRemovedPartIds[partId] = true
  }

  return {
    ...previousState,
    explodingPartIds: {},
    removedPartIds: nextRemovedPartIds
  }
}
