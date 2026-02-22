import { loadSentencesFromContent } from "./contentRepository"
import { createBattleEngine } from "./battleEngine"
import type { ModeValidator } from "./validation"

describe("battleEngine", () => {
  test("routes POS tagging payloads to the tagging validator", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const engine = createBattleEngine({}, { basePointsPerCorrect: 1 })
    const result = engine.validateRound({
      mode: "tagging",
      sentence,
      userInput: {
        tokenIdToPOS: Object.fromEntries(
          sentence.tokens.map((token) => [token.id, token.partOfSpeech])
        )
      }
    })

    expect(result.correct).toBe(true)
    expect(result.score).toBe(sentence.tokens.length * 2)
    expect(result.comboState).toEqual({
      comboCount: 1,
      multiplier: 2,
      maxMultiplier: 3
    })
    expect(result.scoreState).toEqual({
      totalScore: sentence.tokens.length * 2,
      roundScore: sentence.tokens.length * 2,
      comboBonus: sentence.tokens.length,
      speedBonus: 0
    })
  })

  test("returns an error result when a mode has no registered validator", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const engine = createBattleEngine({}, { basePointsPerCorrect: 1 })
    const result = engine.validateRound({
      mode: "agreement",
      sentence,
      userInput: {}
    })

    expect(result.correct).toBe(false)
    expect(result.score).toBe(0)
    expect(result.mistakes).toEqual([
      'No validator registered for mode "agreement".'
    ])
    expect(result.feedback).toEqual([
      {
        code: "engine.unregistered_mode",
        level: "error",
        params: { mode: "agreement" }
      }
    ])
    expect(result.comboState).toEqual({
      comboCount: 0,
      multiplier: 1,
      maxMultiplier: 3
    })
    expect(result.scoreState).toEqual({
      totalScore: 0,
      roundScore: 0,
      comboBonus: 0,
      speedBonus: 0
    })
  })

  test("uses validator registry dispatch for tagging payloads", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const calls: unknown[] = []
    const taggingSpy: ModeValidator<any> = (userInput) => {
      calls.push(userInput)
      return {
        correct: true,
        score: 99,
        mistakes: []
      }
    }

    const engine = createBattleEngine(
      {
        tagging: taggingSpy
      },
      {
        basePointsPerCorrect: 1
      }
    )

    const payload = { tokenIdToPOS: { t1: "DET" } }
    const result = engine.validateRound({
      mode: "tagging",
      sentence,
      userInput: payload
    })

    expect(calls).toEqual([
      expect.objectContaining({
        ...payload,
        eligibleTokenIds: sentence.tokens.map((token) => token.id)
      })
    ])
    expect(result).toMatchObject({
      correct: true,
      score: 198,
      comboState: {
        comboCount: 1,
        multiplier: 2,
        maxMultiplier: 3
      },
      scoreState: {
        totalScore: 198,
        roundScore: 198,
        comboBonus: 99,
        speedBonus: 0
      }
    })
  })
})
