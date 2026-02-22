import { loadBossesFromContent } from "../core"
import {
  createBossModelFromTemplate,
  createBossPartSvgIndex,
  createBossStateFromTemplate
} from "./BossModel"

describe("BossModel", () => {
  test("creates total and part HP structures from a boss template", () => {
    const template = loadBossesFromContent()[0]
    expect(template).toBeDefined()
    if (!template) {
      throw new Error("Boss fixture must include at least one boss.")
    }

    const state = createBossStateFromTemplate(template)
    const expectedMaxHP = template.parts.reduce((sum, part) => sum + part.maxHP, 0)
    const expectedCurrentHP = template.parts.reduce((sum, part) => sum + part.currentHP, 0)

    expect(state.maxHP).toBe(expectedMaxHP)
    expect(state.currentHP).toBe(expectedCurrentHP)
    expect(state.parts).toHaveLength(template.parts.length)
    expect(state.activePartId).toBe(template.parts[0]?.id ?? null)
    expect(state.defeated).toBe(false)
  })

  test("maps boss parts to stable svg element ids", () => {
    const template = loadBossesFromContent()[0]
    expect(template).toBeDefined()
    if (!template) {
      throw new Error("Boss fixture must include at least one boss.")
    }

    const model = createBossModelFromTemplate(template)

    for (const part of template.parts) {
      expect(model.partIdBySvgElementId[part.svgElementId]).toBe(part.id)
    }
  })

  test("rejects duplicate svg ids when building part index", () => {
    const parts = [
      {
        id: "p1",
        name: "Part One",
        maxHP: 10,
        currentHP: 10,
        svgElementId: "dup",
        destroyed: false
      },
      {
        id: "p2",
        name: "Part Two",
        maxHP: 10,
        currentHP: 10,
        svgElementId: "dup",
        destroyed: false
      }
    ]

    expect(() => createBossPartSvgIndex(parts)).toThrow(
      'Duplicate boss svgElementId "dup" for parts "p1" and "p2".'
    )
  })

  test("keeps parts independent and does not mutate the source template", () => {
    const template = loadBossesFromContent()[0]
    expect(template).toBeDefined()
    if (!template) {
      throw new Error("Boss fixture must include at least one boss.")
    }

    const originalTemplate = structuredClone(template)
    const model = createBossModelFromTemplate(template)
    const firstPart = model.state.parts[0]
    const secondPart = model.state.parts[1]
    const secondTemplatePart = template.parts[1]
    if (!firstPart || !secondPart || !secondTemplatePart) {
      throw new Error("Boss fixture must include at least two boss parts.")
    }

    firstPart.currentHP = 0
    firstPart.destroyed = true

    expect(template).toEqual(originalTemplate)
    expect(secondPart.currentHP).toBe(secondTemplatePart.currentHP)
    expect(secondPart.destroyed).toBe(false)
  })
})
