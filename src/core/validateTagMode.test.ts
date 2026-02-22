import { loadSentencesFromContent } from "./contentRepository"
import { executeValidator } from "./validation"
import { validateTagMode, type TagModeUserInput } from "./validateTagMode"

describe("validateTagMode", () => {
  test("returns correct=true with score for a fully correct tagging round", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const userInput: TagModeUserInput = {
      tokenIdToPOS: Object.fromEntries(
        sentence.tokens.map((token) => [token.id, token.partOfSpeech])
      )
    }

    const result = validateTagMode(userInput, sentence)

    expect(result.correct).toBe(true)
    expect(result.score).toBe(sentence.tokens.length)
    expect(result.mistakes).toEqual([])
    expect(result.feedback).toEqual([])
    expect(result.interactionOutcomes).toHaveLength(sentence.tokens.length)
    expect(result.breakdown).toMatchObject({
      mode: "tagging",
      totalTokens: sentence.tokens.length,
      correctTokenCount: sentence.tokens.length,
      incorrectTokenCount: 0,
      missingTokenCount: 0,
      unexpectedTokenCount: 0
    })
  })

  test("returns mistakes and round-level correct=false for wrong, missing, and unexpected tags", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const userInput: TagModeUserInput = {
      tokenIdToPOS: {
        t1: "DET",
        t2: "NOUN", // wrong (expected ADJ)
        t3: "NOUN",
        t999: "VERB" // unexpected token id
      }
    }

    const result = validateTagMode(userInput, sentence)

    expect(result.correct).toBe(false)
    expect(result.score).toBe(2)
    expect(result.feedback).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "tagging.incorrect_pos",
          level: "error"
        }),
        expect.objectContaining({
          code: "tagging.missing_pos",
          level: "error"
        }),
        expect.objectContaining({
          code: "tagging.unknown_token",
          level: "error",
          tokenId: "t999"
        })
      ])
    )
    expect(result.mistakes).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Incorrect POS tag for token"),
        expect.stringContaining("Missing POS tag for token"),
        'Received POS tag for unknown token id "t999".'
      ])
    )
    expect(result.breakdown).toMatchObject({
      totalTokens: sentence.tokens.length,
      correctTokenCount: 2,
      incorrectTokenCount: 1,
      unexpectedTokenCount: 1
    })
  })

  test("evaluates only eligibleTokenIds and ignores excluded sentence tokens", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const userInput: TagModeUserInput = {
      tokenIdToPOS: {
        t1: "NOUN", // excluded from eligibility in this test
        t3: "NOUN"
      },
      eligibleTokenIds: ["t3"]
    }

    const result = validateTagMode(userInput, sentence)

    expect(result.correct).toBe(true)
    expect(result.score).toBe(1)
    expect(result.mistakes).toEqual([])
    expect(result.feedback).toEqual([])
    expect(result.interactionOutcomes).toEqual([
      {
        mode: "tagging",
        sentenceId: sentence.id,
        interactionId: "t3",
        dimension: "partOfSpeech",
        expected: "NOUN",
        received: "NOUN",
        correct: true
      }
    ])
    expect(result.breakdown).toMatchObject({
      sentenceTokenCount: sentence.tokens.length,
      eligibleTokenCount: 1,
      totalTokens: 1,
      correctTokenCount: 1,
      missingTokenCount: 0
    })
  })

  test("is deterministic and does not mutate inputs", () => {
    const sentence = loadSentencesFromContent()[1]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least two sentences.")
    }

    const userInput: TagModeUserInput = {
      tokenIdToPOS: {
        t1: "det",
        t2: "noun",
        t3: "verb",
        t4: "prep",
        t5: "det",
        t6: "noun",
        t7: "punct"
      }
    }

    const originalSentence = structuredClone(sentence)
    const originalInput = structuredClone(userInput)

    const firstResult = validateTagMode(userInput, sentence)
    const secondResult = validateTagMode(userInput, sentence)

    expect(firstResult).toEqual(secondResult)
    expect(sentence).toEqual(originalSentence)
    expect(userInput).toEqual(originalInput)
  })

  test("executeValidator enforces mutation guard for POS validator calls", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const userInput: TagModeUserInput = {
      tokenIdToPOS: Object.fromEntries(
        sentence.tokens.map((token) => [token.id, token.partOfSpeech])
      )
    }

    const originalSentence = structuredClone(sentence)
    const originalInput = structuredClone(userInput)

    const result = executeValidator(validateTagMode, userInput, sentence)

    expect(result.correct).toBe(true)
    expect(sentence).toEqual(originalSentence)
    expect(userInput).toEqual(originalInput)
  })
})
