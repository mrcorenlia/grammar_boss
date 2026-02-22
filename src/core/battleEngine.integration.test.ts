import { createBattleEngine } from "./battleEngine"
import { loadBossesFromContent, loadSentencesFromContent } from "./contentRepository"
import type { ModeValidator } from "./validation"

describe("battleEngine score+combo integration", () => {
  test("applies combo progression across correct rounds and caps at 3x", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const deterministicValidator: ModeValidator<{ correctInteractionCount: number }> = (
      userInput
    ) => ({
      correct: true,
      score: userInput.correctInteractionCount,
      mistakes: []
    })

    const engine = createBattleEngine(
      {
        tagging: deterministicValidator
      },
      {
        basePointsPerCorrect: 10
      }
    )

    const first = engine.validateRound({
      mode: "tagging",
      sentence,
      userInput: { correctInteractionCount: 2 }
    })
    const second = engine.validateRound({
      mode: "tagging",
      sentence,
      userInput: { correctInteractionCount: 2 }
    })
    const third = engine.validateRound({
      mode: "tagging",
      sentence,
      userInput: { correctInteractionCount: 2 }
    })

    expect(first.score).toBe(40)
    expect(second.score).toBe(60)
    expect(third.score).toBe(60)
    expect(first.comboState.multiplier).toBe(2)
    expect(second.comboState.multiplier).toBe(3)
    expect(third.comboState.multiplier).toBe(3)
    expect(third.scoreState).toEqual({
      totalScore: 160,
      roundScore: 60,
      comboBonus: 40,
      speedBonus: 0
    })
    const engineState = engine.getState()
    expect(engineState).toEqual({
      comboState: third.comboState,
      scoreState: third.scoreState,
      bossState: null,
      answerTrackingState: {
        solvedKeys: {},
        roundIndex: 3,
        playerStats: {
          totals: {
            attempts: 0,
            correct: 0,
            incorrect: 0
          },
          byMode: {},
          byDimension: {},
          confusionByDimension: {}
        }
      }
    })
  })

  test("resets combo after incorrect round and keeps score progression deterministic", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const branchingValidator: ModeValidator<{ correct: boolean; interactions: number }> = (
      userInput
    ) => ({
      correct: userInput.correct,
      score: userInput.interactions,
      mistakes: userInput.correct ? [] : ["not fully correct"]
    })

    const engine = createBattleEngine(
      {
        tagging: branchingValidator
      },
      {
        basePointsPerCorrect: 10
      }
    )

    const first = engine.validateRound({
      mode: "tagging",
      sentence,
      userInput: { correct: true, interactions: 2 }
    })
    const second = engine.validateRound({
      mode: "tagging",
      sentence,
      userInput: { correct: false, interactions: 2 }
    })
    const third = engine.validateRound({
      mode: "tagging",
      sentence,
      userInput: { correct: true, interactions: 2 }
    })

    expect(first.scoreState.totalScore).toBe(40)
    expect(second.comboState).toEqual({
      comboCount: 0,
      multiplier: 1,
      maxMultiplier: 3
    })
    expect(second.scoreState).toEqual({
      totalScore: 60,
      roundScore: 20,
      comboBonus: 0,
      speedBonus: 0
    })
    expect(third.scoreState).toEqual({
      totalScore: 100,
      roundScore: 40,
      comboBonus: 20,
      speedBonus: 0
    })
  })

  test("threads optional speed bonus hook into round score state", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const validator: ModeValidator<{ interactions: number }> = (userInput) => ({
      correct: false,
      score: userInput.interactions,
      mistakes: ["incomplete"]
    })

    const engine = createBattleEngine(
      {
        tagging: validator
      },
      {
        basePointsPerCorrect: 10,
        speedBonusHook: ({ elapsedMs }) => (elapsedMs !== null && elapsedMs < 1000 ? 5 : 0)
      }
    )

    const fastRound = engine.validateRound({
      mode: "tagging",
      sentence,
      userInput: { interactions: 1 },
      elapsedMs: 900
    })
    const slowRound = engine.validateRound({
      mode: "tagging",
      sentence,
      userInput: { interactions: 1 },
      elapsedMs: 3000
    })

    expect(fastRound.scoreState).toEqual({
      totalScore: 15,
      roundScore: 15,
      comboBonus: 0,
      speedBonus: 5
    })
    expect(slowRound.scoreState).toEqual({
      totalScore: 25,
      roundScore: 10,
      comboBonus: 0,
      speedBonus: 0
    })
  })

  test("locks previously solved tagging interactions when a sentence repeats", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const engine = createBattleEngine(
      {},
      {
        basePointsPerCorrect: 10,
        comboMaxMultiplier: 1
      }
    )

    const firstRound = engine.validateRound({
      mode: "tagging",
      sentence,
      userInput: {
        tokenIdToPOS: {
          t1: "DET"
        }
      }
    })
    const secondRound = engine.validateRound({
      mode: "tagging",
      sentence,
      userInput: {
        tokenIdToPOS: {
          t1: "DET"
        }
      }
    })

    expect(firstRound.constraints.lockedInteractionIds).toEqual([])
    expect(firstRound.score).toBe(10)
    expect(secondRound.constraints.lockedInteractionIds).toEqual(["t1"])
    expect(secondRound.constraints.eligibleInteractionIds).not.toContain("t1")
    expect(secondRound.score).toBe(0)
  })

  test("applies pre-answered rule to exclude interactions from score and stats", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const engine = createBattleEngine(
      {},
      {
        basePointsPerCorrect: 10,
        comboMaxMultiplier: 1,
        preAnsweredRule: ({ expected }) => expected === "DET"
      }
    )

    const result = engine.validateRound({
      mode: "tagging",
      sentence,
      userInput: {
        tokenIdToPOS: Object.fromEntries(
          sentence.tokens.map((token) => [token.id, token.partOfSpeech])
        )
      }
    })

    expect(result.constraints.preAnsweredInteractionIds).toEqual(["t1"])
    expect(result.score).toBe((sentence.tokens.length - 1) * 10)
    expect(result.playerStats.totals).toEqual({
      attempts: sentence.tokens.length - 1,
      correct: sentence.tokens.length - 1,
      incorrect: 0
    })
  })

  test("returns neutral round with zero eligible interactions", () => {
    const sentence = loadSentencesFromContent()[0]
    const bossTemplate = loadBossesFromContent()[0]
    expect(sentence).toBeDefined()
    expect(bossTemplate).toBeDefined()
    if (!sentence || !bossTemplate) {
      throw new Error("Sentence and boss fixtures must both exist.")
    }

    const engine = createBattleEngine(
      {},
      {
        basePointsPerCorrect: 10,
        bossTemplate,
        preAnsweredRule: () => true
      }
    )

    const result = engine.validateRound({
      mode: "tagging",
      sentence,
      userInput: {
        tokenIdToPOS: Object.fromEntries(
          sentence.tokens.map((token) => [token.id, token.partOfSpeech])
        )
      }
    })

    expect(result.constraints.eligibleInteractionIds).toEqual([])
    expect(result.score).toBe(0)
    expect(result.scoreState.totalScore).toBe(0)
    expect(result.comboState).toEqual({
      comboCount: 0,
      multiplier: 1,
      maxMultiplier: 3
    })
    expect(result.bossState?.currentHP).toBe(180)
    expect(result.feedback).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "engine.no_eligible_interactions",
          level: "info"
        })
      ])
    )
  })

  test("tracks confusion stats for incorrect eligible outcomes", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const engine = createBattleEngine(
      {},
      {
        basePointsPerCorrect: 10,
        comboMaxMultiplier: 1,
        preAnsweredRule: ({ interactionId }) =>
          interactionId !== "t2" && interactionId !== "t3"
      }
    )

    const result = engine.validateRound({
      mode: "tagging",
      sentence,
      userInput: {
        tokenIdToPOS: {
          t2: "ADV",
          t3: "NOUN"
        }
      }
    })

    expect(result.constraints.eligibleInteractionIds).toEqual(["t2", "t3"])
    expect(result.playerStats.totals).toEqual({
      attempts: 2,
      correct: 1,
      incorrect: 1
    })
    expect(result.playerStats.byMode.tagging).toEqual({
      attempts: 2,
      correct: 1,
      incorrect: 1
    })
    expect(result.playerStats.byDimension.partOfSpeech).toEqual({
      attempts: 2,
      correct: 1,
      incorrect: 1
    })
    expect(
      result.playerStats.confusionByDimension.partOfSpeech?.ADJ?.ADV
    ).toBe(1)
  })

  test("updates boss HP from engine state and emits part-destroyed events", () => {
    const sentence = loadSentencesFromContent()[0]
    const bossTemplate = loadBossesFromContent()[0]
    expect(sentence).toBeDefined()
    expect(bossTemplate).toBeDefined()
    if (!sentence || !bossTemplate) {
      throw new Error("Sentence and boss fixtures must both exist.")
    }

    const validator: ModeValidator<{ interactions: number }> = (userInput) => ({
      correct: false,
      score: userInput.interactions,
      mistakes: ["incomplete"]
    })

    const engine = createBattleEngine(
      {
        tagging: validator
      },
      {
        basePointsPerCorrect: 10,
        bossTemplate
      }
    )

    const initialBossState = engine.getState().bossState
    expect(initialBossState?.currentHP).toBe(180)

    const firstRound = engine.validateRound({
      mode: "tagging",
      sentence,
      userInput: { interactions: 1 }
    })
    const secondRound = engine.validateRound({
      mode: "tagging",
      sentence,
      userInput: { interactions: 3 }
    })

    expect(firstRound.bossState?.currentHP).toBe(170)
    expect(firstRound.bossEvents).toEqual([])
    expect(secondRound.bossState?.currentHP).toBe(140)
    expect(secondRound.bossState?.activePartId).toBe("horn_right")
    expect(secondRound.bossEvents).toEqual([
      {
        type: "boss.part_destroyed",
        bossId: bossTemplate.id,
        partId: "horn_left",
        svgElementId: "horn_left"
      }
    ])
    expect(engine.getState().bossState).toEqual(secondRound.bossState)
  })
})
