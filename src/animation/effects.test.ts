import {
  collectDamagedPartIds,
  collectDestroyedPartIds,
  createInitialBossVisualState,
  deriveBossVisualState,
  finalizeAllPartExplosions,
  finalizePartExplosion,
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

  test("collects unique destroyed part ids from round events", () => {
    const events: BossDamageEvent[] = [
      {
        type: "boss.part_destroyed",
        bossId: "b1",
        partId: "arm_left",
        svgElementId: "arm_left"
      },
      {
        type: "boss.part_destroyed",
        bossId: "b1",
        partId: "arm_left",
        svgElementId: "arm_left"
      },
      {
        type: "boss.part_destroyed",
        bossId: "b1",
        partId: "arm_right",
        svgElementId: "arm_right"
      }
    ]

    expect(collectDestroyedPartIds(events)).toEqual(["arm_left", "arm_right"])
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
    expect(next.explodingPartIds).toEqual({})
    expect(next.removedPartIds).toEqual({})
    expect(next.flashActive).toBe(true)
    expect(next.shakeActive).toBe(true)
    expect(next.lastProcessedRoundId).toBe(1)
  })

  test("starts explosion state for destroyed parts that are not yet removed", () => {
    const previous = createInitialBossVisualState()
    const next = deriveBossVisualState(previous, {
      roundId: 2,
      events: [
        {
          type: "boss.part_destroyed",
          bossId: "b1",
          partId: "core",
          svgElementId: "core"
        }
      ]
    })

    expect(next.explodingPartIds).toEqual({ core: true })
    expect(next.removedPartIds).toEqual({})
    expect(next.crackedPartIds).toEqual({ core: true })
    expect(next.flashActive).toBe(false)
    expect(next.shakeActive).toBe(false)
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
      explodingPartIds: {},
      removedPartIds: {},
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

  test("finalizes a single part explosion without mutating input", () => {
    const previous: BossVisualState = {
      crackedPartIds: { horn_left: true },
      explodingPartIds: { horn_left: true, horn_right: true },
      removedPartIds: {},
      flashActive: false,
      shakeActive: false,
      lastProcessedRoundId: 6
    }

    const next = finalizePartExplosion(previous, "horn_left")
    expect(previous.explodingPartIds).toEqual({
      horn_left: true,
      horn_right: true
    })
    expect(next.explodingPartIds).toEqual({ horn_right: true })
    expect(next.removedPartIds).toEqual({ horn_left: true })
  })

  test("finalizes all part explosions in one pass", () => {
    const previous: BossVisualState = {
      crackedPartIds: { core: true },
      explodingPartIds: { horn_left: true, core: true },
      removedPartIds: { arm_left: true },
      flashActive: false,
      shakeActive: false,
      lastProcessedRoundId: 7
    }

    const next = finalizeAllPartExplosions(previous)
    expect(next.explodingPartIds).toEqual({})
    expect(next.removedPartIds).toEqual({
      arm_left: true,
      horn_left: true,
      core: true
    })
  })

  test("does not restart explosion for a part already removed in a previous round", () => {
    const previous: BossVisualState = {
      crackedPartIds: { core: true },
      explodingPartIds: {},
      removedPartIds: { core: true },
      flashActive: false,
      shakeActive: false,
      lastProcessedRoundId: 9
    }

    const next = deriveBossVisualState(previous, {
      roundId: 10,
      events: [
        {
          type: "boss.part_destroyed",
          bossId: "b1",
          partId: "core",
          svgElementId: "core"
        }
      ]
    })

    expect(next.explodingPartIds).toEqual({})
    expect(next.removedPartIds).toEqual({ core: true })
  })
})
