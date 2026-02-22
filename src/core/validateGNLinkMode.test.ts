import { loadSentencesFromContent } from "./contentRepository"
import { executeValidator } from "./validation"
import { validateGNLinkMode, type GNLinkModeUserInput } from "./validateGNLinkMode"

describe("validateGNLinkMode", () => {
  test("returns correct=true for fully correct GN link mapping", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const userInput: GNLinkModeUserInput = {
      dependentIdToNounId: {
        t1: "t3",
        t2: "t3",
        t4: "t3"
      }
    }

    const result = validateGNLinkMode(userInput, sentence)

    expect(result.correct).toBe(true)
    expect(result.score).toBe(3)
    expect(result.mistakes).toEqual([])
    expect(result.feedback).toEqual([])
    expect(result.interactionOutcomes).toEqual([
      expect.objectContaining({ interactionId: "t1", correct: true }),
      expect.objectContaining({ interactionId: "t2", correct: true }),
      expect.objectContaining({ interactionId: "t4", correct: true })
    ])
  })

  test("reports missing and incorrect links", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const userInput: GNLinkModeUserInput = {
      dependentIdToNounId: {
        t1: "t3",
        t2: "t1"
      }
    }

    const result = validateGNLinkMode(userInput, sentence)

    expect(result.correct).toBe(false)
    expect(result.score).toBe(1)
    expect(result.feedback).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "gn-link.unknown_noun",
          tokenId: "t2"
        }),
        expect.objectContaining({
          code: "gn-link.missing_link",
          tokenId: "t4"
        })
      ])
    )
  })

  test("reports unknown dependent tokens", () => {
    const sentence = loadSentencesFromContent()[1]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least two sentences.")
    }

    const userInput: GNLinkModeUserInput = {
      dependentIdToNounId: {
        t1: "t2",
        t5: "t6",
        t999: "t2"
      }
    }

    const result = validateGNLinkMode(userInput, sentence)

    expect(result.correct).toBe(false)
    expect(result.feedback).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "gn-link.unknown_dependent",
          tokenId: "t999"
        })
      ])
    )
  })

  test("evaluates only eligible links when eligibleLinkIds is provided", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const userInput: GNLinkModeUserInput = {
      dependentIdToNounId: {
        t1: "t3",
        t2: "t3",
        t4: "t1"
      },
      eligibleLinkIds: ["t1", "t2"]
    }

    const result = validateGNLinkMode(userInput, sentence)

    expect(result.correct).toBe(true)
    expect(result.score).toBe(2)
    expect(result.feedback).toEqual([])
    expect(result.interactionOutcomes).toEqual([
      expect.objectContaining({ interactionId: "t1", correct: true }),
      expect.objectContaining({ interactionId: "t2", correct: true })
    ])
    expect(result.breakdown).toMatchObject({
      eligibleLinkIds: ["t1", "t2"]
    })
  })

  test("is deterministic and does not mutate arguments", () => {
    const sentence = loadSentencesFromContent()[1]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least two sentences.")
    }

    const userInput: GNLinkModeUserInput = {
      dependentIdToNounId: {
        t1: "t2",
        t5: "t6"
      }
    }
    const originalSentence = structuredClone(sentence)
    const originalInput = structuredClone(userInput)

    const firstResult = validateGNLinkMode(userInput, sentence)
    const secondResult = validateGNLinkMode(userInput, sentence)
    const guardedResult = executeValidator(validateGNLinkMode, userInput, sentence)

    expect(firstResult).toEqual(secondResult)
    expect(guardedResult).toEqual(firstResult)
    expect(sentence).toEqual(originalSentence)
    expect(userInput).toEqual(originalInput)
  })
})
