import {
  collectDamagedPartIds,
  createInitialBossVisualState,
  deriveBossVisualState,
  type BossVisualState
} from "./effects"
import type { BossDamageEvent } from "../boss/DamageSystem"

describe("animation effects state", () => {
  test("collects unique damaged part ids from round events", () => {
    const events: BossDamageEvent[] = [
      {
        type: "boss.part_damaged",
        bossId: "b1",
        partId: "horn_left",
        svgElementId: "horn_left",
        damage: 10,
        remainingHP: 20
      },
      {
        type: "boss.part_damaged",
        bossId: "b1",
        partId: "horn_left",
        svgElementId: "horn_left",
        damage: 5,
        remainingHP: 15
      },
      {
        type: "boss.part_destroyed",
        bossId: "b1",
        partId: "horn_left",
        svgElementId: "horn_left"
      }
    ]

    expect(collectDamagedPartIds(events)).toEqual(["horn_left"])
  })

  test("derives flash, shake, and cracked part states from damage events", () => {
    const previous = createInitialBossVisualState()
    const events: BossDamageEvent[] = [
      {
        type: "boss.part_damaged",
        bossId: "b1",
        partId: "arm_right",
        svgElementId: "arm_right",
        damage: 8,
        remainingHP: 32
      }
    ]

    const next = deriveBossVisualState(previous, {
      roundId: 1,
      events
    })

    expect(previous).toEqual(createInitialBossVisualState())
    expect(next.crackedPartIds).toEqual({ arm_right: true })
    expect(next.flashActive).toBe(true)
    expect(next.shakeActive).toBe(true)
    expect(next.lastProcessedRoundId).toBe(1)
  })

  test("is idempotent for a duplicate round id", () => {
    const previous = deriveBossVisualState(createInitialBossVisualState(), {
      roundId: 3,
      events: []
    })

    const duplicate = deriveBossVisualState(previous, {
      roundId: 3,
      events: [
        {
          type: "boss.part_damaged",
          bossId: "b1",
          partId: "core",
          svgElementId: "core",
          damage: 4,
          remainingHP: 36
        }
      ]
    })

    expect(duplicate).toBe(previous)
  })

  test("keeps existing cracks and disables flash/shake on rounds without damage", () => {
    const crackedState: BossVisualState = {
      crackedPartIds: {
        horn_left: true,
        horn_right: true
      },
      flashActive: true,
      shakeActive: true,
      lastProcessedRoundId: 4
    }

    const next = deriveBossVisualState(crackedState, {
      roundId: 5,
      events: [
        {
          type: "boss.part_destroyed",
          bossId: "b1",
          partId: "horn_left",
          svgElementId: "horn_left"
        }
      ]
    })

    expect(next.crackedPartIds).toEqual({
      horn_left: true,
      horn_right: true
    })
    expect(next.flashActive).toBe(false)
    expect(next.shakeActive).toBe(false)
    expect(next.lastProcessedRoundId).toBe(5)
  })
})
