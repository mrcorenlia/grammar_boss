import type { BossPartState, BossState, BossTemplate } from "../core"

export type BossPartSvgIndex = Record<string, string>

export type BossModel = {
  state: BossState
  partIdBySvgElementId: BossPartSvgIndex
}

const toNonNegativeInteger = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0

const normalizePartState = (template: BossTemplate["parts"][number]): BossPartState => {
  const maxHP = toNonNegativeInteger(template.maxHP)
  const currentHP = Math.min(toNonNegativeInteger(template.currentHP), maxHP)

  return {
    id: template.id,
    name: template.name,
    maxHP,
    currentHP,
    svgElementId: template.svgElementId,
    destroyed: currentHP <= 0
  }
}

// Builds a stable SVG id -> part id index for animation/rendering lookup.
// Duplicate SVG ids are rejected because they break stable part addressing.
export const createBossPartSvgIndex = (parts: BossPartState[]): BossPartSvgIndex => {
  const index: BossPartSvgIndex = {}

  for (const part of parts) {
    const existingPartId = index[part.svgElementId]
    if (existingPartId !== undefined) {
      throw new Error(
        `Duplicate boss svgElementId "${part.svgElementId}" for parts "${existingPartId}" and "${part.id}".`
      )
    }

    index[part.svgElementId] = part.id
  }

  return index
}

// Creates battle-ready boss HP state from a static template.
// Total HP values are derived from parts to preserve part independence.
export const createBossStateFromTemplate = (template: BossTemplate): BossState => {
  const parts = template.parts.map((part) => normalizePartState(part))
  const maxHP = parts.reduce((sum, part) => sum + part.maxHP, 0)
  const currentHP = parts.reduce((sum, part) => sum + part.currentHP, 0)
  const activePartId = parts.find((part) => !part.destroyed)?.id ?? null

  return {
    id: template.id,
    name: template.name,
    maxHP,
    currentHP,
    activePartId,
    parts,
    defeated: activePartId === null
  }
}

// One-stop model constructor used by engine/UI layers.
export const createBossModelFromTemplate = (template: BossTemplate): BossModel => {
  const state = createBossStateFromTemplate(template)
  const partIdBySvgElementId = createBossPartSvgIndex(state.parts)

  return {
    state,
    partIdBySvgElementId
  }
}
