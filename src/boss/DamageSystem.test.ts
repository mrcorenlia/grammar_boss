import { loadBossesFromContent } from "../core"
import { createBossStateFromTemplate } from "./BossModel"
import { applyDamageToBossState } from "./DamageSystem"

describe("DamageSystem", () => {
  test("applies damage to the active part first", () => {
    const template = loadBossesFromContent()[0]
    expect(template).toBeDefined()
    if (!template) {
      throw new Error("Boss fixture must include at least one boss.")
    }

    const initialState = createBossStateFromTemplate(template)
    const result = applyDamageToBossState(initialState, 10)

    const firstPart = result.state.parts[0]
    expect(firstPart?.id).toBe(template.parts[0]?.id)
    expect(firstPart?.currentHP).toBe((template.parts[0]?.currentHP ?? 0) - 10)
    expect(result.state.currentHP).toBe(initialState.currentHP - 10)
    expect(result.events).toEqual([])
    expect(result.overflowDamage).toBe(0)
  })

  test("carries overflow damage to the next parts sequentially", () => {
    const template = loadBossesFromContent()[0]
    expect(template).toBeDefined()
    if (!template) {
      throw new Error("Boss fixture must include at least one boss.")
    }

    const initialState = createBossStateFromTemplate(template)
    const result = applyDamageToBossState(initialState, 35)

    const firstPart = result.state.parts[0]
    const secondPart = result.state.parts[1]
    if (!firstPart || !secondPart) {
      throw new Error("Boss fixture must include at least two parts.")
    }

    expect(firstPart.currentHP).toBe(0)
    expect(firstPart.destroyed).toBe(true)
    expect(secondPart.currentHP).toBe(25)
    expect(secondPart.destroyed).toBe(false)
    expect(result.state.activePartId).toBe(secondPart.id)
    expect(result.events).toEqual([
      {
        type: "boss.part_destroyed",
        bossId: initialState.id,
        partId: firstPart.id,
        svgElementId: firstPart.svgElementId
      }
    ])
    expect(result.overflowDamage).toBe(0)
    expect(result.damageApplied).toBe(35)
  })

  test("emits part-destroyed and boss-defeated events when lethal damage is applied", () => {
    const template = loadBossesFromContent()[0]
    expect(template).toBeDefined()
    if (!template) {
      throw new Error("Boss fixture must include at least one boss.")
    }

    const initialState = createBossStateFromTemplate(template)
    const result = applyDamageToBossState(initialState, 1000)

    expect(result.state.defeated).toBe(true)
    expect(result.state.currentHP).toBe(0)
    expect(result.state.activePartId).toBe(null)
    expect(result.damageApplied).toBe(initialState.currentHP)
    expect(result.overflowDamage).toBe(1000 - initialState.currentHP)

    const partDestroyedEvents = result.events.filter(
      (event) => event.type === "boss.part_destroyed"
    )
    const defeatedEvents = result.events.filter(
      (event) => event.type === "boss.defeated"
    )

    expect(partDestroyedEvents).toHaveLength(initialState.parts.length)
    expect(defeatedEvents).toEqual([
      {
        type: "boss.defeated",
        bossId: initialState.id
      }
    ])
  })

  test("does not mutate the input state", () => {
    const template = loadBossesFromContent()[0]
    expect(template).toBeDefined()
    if (!template) {
      throw new Error("Boss fixture must include at least one boss.")
    }

    const initialState = createBossStateFromTemplate(template)
    const originalState = structuredClone(initialState)

    const result = applyDamageToBossState(initialState, 20)

    expect(initialState).toEqual(originalState)
    expect(result.state).not.toBe(initialState)
    expect(result.state.parts).not.toBe(initialState.parts)
    expect(result.state.parts[0]).not.toBe(initialState.parts[0])
  })
})
