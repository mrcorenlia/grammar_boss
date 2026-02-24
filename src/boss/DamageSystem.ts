import type { BossPartState, BossState } from "../core"

export type BossDamageEvent =
  | {
      type: "boss.part_damaged"
      bossId: string
      partId: string
      svgElementId: string
      damage: number
      remainingHP: number
    }
  | {
      type: "boss.part_destroyed"
      bossId: string
      partId: string
      svgElementId: string
    }
  | {
      type: "boss.defeated"
      bossId: string
    }

export type BossPartDestroyedEvent = Extract<
  BossDamageEvent,
  { type: "boss.part_destroyed" }
>

export type BossDamageResult = {
  state: BossState
  events: BossDamageEvent[]
  damageApplied: number
  overflowDamage: number
}

const toNonNegativeInteger = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0

const clonePart = (part: BossPartState): BossPartState => ({
  id: part.id,
  name: part.name,
  maxHP: part.maxHP,
  currentHP: part.currentHP,
  svgElementId: part.svgElementId,
  destroyed: part.destroyed
})

const findFirstAlivePartIndex = (parts: BossPartState[]): number =>
  parts.findIndex((part) => !part.destroyed && part.currentHP > 0)

const findActivePartIndex = (state: BossState, parts: BossPartState[]): number => {
  if (!state.activePartId) {
    return findFirstAlivePartIndex(parts)
  }

  const byIdIndex = parts.findIndex((part) => part.id === state.activePartId)
  const byIdPart = byIdIndex >= 0 ? parts[byIdIndex] : undefined
  if (byIdPart && !byIdPart.destroyed && byIdPart.currentHP > 0) {
    return byIdIndex
  }

  return findFirstAlivePartIndex(parts)
}

const findNextAlivePartIndex = (parts: BossPartState[], fromIndex: number): number =>
  parts.findIndex((part, index) => index > fromIndex && !part.destroyed && part.currentHP > 0)

// Applies sequential damage to a boss state:
// 1) hit active part first
// 2) carry overflow to subsequent parts
// 3) emit part-destroyed and boss-defeated events
// The input state is never mutated.
export const applyDamageToBossState = (
  state: BossState,
  incomingDamage: number
): BossDamageResult => {
  const normalizedIncomingDamage = toNonNegativeInteger(incomingDamage)
  const parts = state.parts.map((part) => clonePart(part))
  const events: BossDamageEvent[] = []
  let remainingDamage = normalizedIncomingDamage
  let activeIndex = findActivePartIndex(state, parts)

  while (remainingDamage > 0 && activeIndex >= 0) {
    const activePart = parts[activeIndex]
    if (!activePart) {
      break
    }

    if (activePart.destroyed || activePart.currentHP <= 0) {
      activeIndex = findNextAlivePartIndex(parts, activeIndex)
      continue
    }

    const damageToCurrentPart = Math.min(activePart.currentHP, remainingDamage)
    activePart.currentHP -= damageToCurrentPart
    remainingDamage -= damageToCurrentPart

    // Emit part damage before any possible destruction event for deterministic ordering.
    if (damageToCurrentPart > 0) {
      events.push({
        type: "boss.part_damaged",
        bossId: state.id,
        partId: activePart.id,
        svgElementId: activePart.svgElementId,
        damage: damageToCurrentPart,
        remainingHP: activePart.currentHP
      })
    }

    if (activePart.currentHP <= 0) {
      activePart.currentHP = 0
      activePart.destroyed = true
      events.push({
        type: "boss.part_destroyed",
        bossId: state.id,
        partId: activePart.id,
        svgElementId: activePart.svgElementId
      })

      activeIndex = findNextAlivePartIndex(parts, activeIndex)
      continue
    }

    break
  }

  const nextActivePart = parts.find((part) => !part.destroyed && part.currentHP > 0) ?? null
  const nextCurrentHP = parts.reduce((sum, part) => sum + part.currentHP, 0)
  const nextDefeated = nextActivePart === null

  if (nextDefeated && !state.defeated) {
    events.push({
      type: "boss.defeated",
      bossId: state.id
    })
  }

  return {
    state: {
      id: state.id,
      name: state.name,
      maxHP: state.maxHP,
      currentHP: nextCurrentHP,
      activePartId: nextActivePart?.id ?? null,
      parts,
      defeated: nextDefeated
    },
    events,
    damageApplied: normalizedIncomingDamage - remainingDamage,
    overflowDamage: remainingDamage
  }
}
