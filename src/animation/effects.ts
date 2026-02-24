import type { BossDamageEvent } from "../boss/DamageSystem"

export type BossVisualState = {
  crackedPartIds: Record<string, true>
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
  const nextCrackedPartIds = { ...previousState.crackedPartIds }
  for (const partId of damagedPartIds) {
    nextCrackedPartIds[partId] = true
  }

  const hasDamage = damagedPartIds.length > 0

  return {
    crackedPartIds: nextCrackedPartIds,
    flashActive: hasDamage,
    shakeActive: hasDamage,
    lastProcessedRoundId: input.roundId
  }
}
