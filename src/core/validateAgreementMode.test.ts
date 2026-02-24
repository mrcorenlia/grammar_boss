import { loadSentencesFromContent } from "./contentRepository"
import { executeValidator } from "./validation"
import {
  validateAgreementMode,
  type AgreementModeUserInput
} from "./validateAgreementMode"

describe("validateAgreementMode", () => {
  test("returns correct=true for fully correct noun agreement", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const userInput: AgreementModeUserInput = {
      nounIdToGender: {
        t3: "f"
      },
      nounIdToNumber: {
        t3: "s"
      }
    }

    const result = validateAgreementMode(userInput, sentence)

    expect(result.correct).toBe(true)
    expect(result.score).toBe(1)
    expect(result.mistakes).toEqual([])
    expect(result.feedback).toEqual([])
    expect(result.interactionOutcomes).toEqual([
      expect.objectContaining({
        interactionId: "t3",
        expected: "f|s",
        received: "f|s",
        correct: true
      })
    ])
  })

  test("reports missing and incorrect noun agreement fields", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const userInput: AgreementModeUserInput = {
      nounIdToGender: {
        t3: "m"
      },
      nounIdToNumber: {}
    }

    const result = validateAgreementMode(userInput, sentence)

    expect(result.correct).toBe(false)
    expect(result.score).toBe(0)
    expect(result.feedback).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "agreement.incorrect_gender",
          tokenId: "t3"
        }),
        expect.objectContaining({
          code: "agreement.missing_number",
          tokenId: "t3"
        })
      ])
    )
  })

  test("reports unknown noun ids from submitted maps", () => {
    const sentence = loadSentencesFromContent()[1]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least two sentences.")
    }

    const userInput: AgreementModeUserInput = {
      nounIdToGender: {
        t6: "m",
        t999: "f"
      },
      nounIdToNumber: {
        t6: "s"
      }
    }

    const result = validateAgreementMode(userInput, sentence)

    expect(result.correct).toBe(false)
    expect(result.score).toBe(1)
    expect(result.feedback).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "agreement.unknown_noun",
          tokenId: "t999"
        })
      ])
    )
  })

  test("evaluates only eligible nouns when eligibleNounIds is provided", () => {
    const sentence = loadSentencesFromContent()[1]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least two sentences.")
    }

    const userInput: AgreementModeUserInput = {
      nounIdToGender: {
        t6: "m"
      },
      nounIdToNumber: {
        t6: "s"
      },
      eligibleNounIds: ["t6"]
    }

    const result = validateAgreementMode(userInput, sentence)

    expect(result.correct).toBe(true)
    expect(result.score).toBe(1)
    expect(result.feedback).toEqual([])
    expect(result.breakdown).toMatchObject({
      eligibleNounIds: ["t6"]
    })
  })

  test("is deterministic and does not mutate arguments", () => {
    const sentence = loadSentencesFromContent()[1]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least two sentences.")
    }

    const userInput: AgreementModeUserInput = {
      nounIdToGender: {
        t6: "m"
      },
      nounIdToNumber: {
        t6: "s"
      }
    }
    const originalSentence = structuredClone(sentence)
    const originalInput = structuredClone(userInput)

    const firstResult = validateAgreementMode(userInput, sentence)
    const secondResult = validateAgreementMode(userInput, sentence)
    const guardedResult = executeValidator(validateAgreementMode, userInput, sentence)

    expect(firstResult).toEqual(secondResult)
    expect(guardedResult).toEqual(firstResult)
    expect(sentence).toEqual(originalSentence)
    expect(userInput).toEqual(originalInput)
  })
})
