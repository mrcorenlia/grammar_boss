import {
  calculateComboMultiplier,
  createInitialComboState,
  updateComboState
} from "./combo"
import type { ComboState } from "./types"

describe("combo module", () => {
  test("creates an initial combo state at 1x multiplier", () => {
    expect(createInitialComboState()).toEqual({
      comboCount: 0,
      multiplier: 1,
      maxMultiplier: 3
    })
  })

  test("increments combo on fully correct rounds", () => {
    const initial = createInitialComboState()

    const afterFirstCorrect = updateComboState(initial, true)
    const afterSecondCorrect = updateComboState(afterFirstCorrect, true)

    expect(afterFirstCorrect).toEqual({
      comboCount: 1,
      multiplier: 2,
      maxMultiplier: 3
    })
    expect(afterSecondCorrect).toEqual({
      comboCount: 2,
      multiplier: 3,
      maxMultiplier: 3
    })
  })

  test("resets combo on incorrect rounds", () => {
    const activeCombo: ComboState = {
      comboCount: 2,
      multiplier: 3,
      maxMultiplier: 3
    }

    expect(updateComboState(activeCombo, false)).toEqual({
      comboCount: 0,
      multiplier: 1,
      maxMultiplier: 3
    })
  })

  test("caps multiplier progression at 3x by default", () => {
    expect(calculateComboMultiplier(0)).toBe(1)
    expect(calculateComboMultiplier(1)).toBe(2)
    expect(calculateComboMultiplier(2)).toBe(3)
    expect(calculateComboMultiplier(100)).toBe(3)
  })

  test("supports custom max multiplier and normalizes invalid values", () => {
    expect(createInitialComboState(5.9)).toEqual({
      comboCount: 0,
      multiplier: 1,
      maxMultiplier: 5
    })
    expect(calculateComboMultiplier(9, 2.4)).toBe(2)
    expect(calculateComboMultiplier(2, Number.NaN)).toBe(3)
  })

  test("is deterministic and does not mutate previous combo state", () => {
    const previous: ComboState = {
      comboCount: 1,
      multiplier: 2,
      maxMultiplier: 3
    }
    const originalPrevious = structuredClone(previous)

    const firstResult = updateComboState(previous, true)
    const secondResult = updateComboState(previous, true)

    expect(firstResult).toEqual(secondResult)
    expect(firstResult).toEqual({
      comboCount: 2,
      multiplier: 3,
      maxMultiplier: 3
    })
    expect(previous).toEqual(originalPrevious)
  })
})
