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

    const engine = createBattleEngine()
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
    expect(result.score).toBe(sentence.tokens.length)
  })

  test("returns an error result when a mode has no registered validator", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const engine = createBattleEngine()
    const result = engine.validateRound({
      mode: "structure",
      sentence,
      userInput: {}
    })

    expect(result.correct).toBe(false)
    expect(result.score).toBe(0)
    expect(result.mistakes).toEqual([
      'No validator registered for mode "structure".'
    ])
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

    const engine = createBattleEngine({
      tagging: taggingSpy
    })

    const payload = { tokenIdToPOS: { t1: "DET" } }
    const result = engine.validateRound({
      mode: "tagging",
      sentence,
      userInput: payload
    })

    expect(calls).toEqual([payload])
    expect(result).toMatchObject({
      correct: true,
      score: 99
    })
  })
})
