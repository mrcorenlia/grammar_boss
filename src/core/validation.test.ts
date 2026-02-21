import { loadSentencesFromContent } from "./contentRepository"
import {
  assertValidationResult,
  executeValidator,
  isValidationResult,
  type ModeValidator,
  type ValidatorRegistry
} from "./validation"

describe("validation contracts", () => {
  test("accepts a valid ValidationResult shape", () => {
    const validResult = {
      correct: true,
      score: 12,
      mistakes: [],
      breakdown: { round: 1 }
    }

    expect(isValidationResult(validResult)).toBe(true)
    expect(assertValidationResult(validResult)).toEqual(validResult)
  })

  test("rejects malformed ValidationResult shape", () => {
    const invalidResult = {
      correct: true,
      score: 12,
      mistakes: "not-an-array"
    }

    expect(isValidationResult(invalidResult)).toBe(false)
    expect(() => assertValidationResult(invalidResult)).toThrow(
      "Validator output must match ValidationResult"
    )
  })

  test("executeValidator enforces (userInput, sentence) and returns ValidationResult", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const validator: ModeValidator<{ selectedTokenIds: string[] }> = (
      userInput,
      currentSentence
    ) => ({
      correct: userInput.selectedTokenIds.length === currentSentence.tokens.length,
      score: userInput.selectedTokenIds.length,
      mistakes: [],
      breakdown: {
        sentenceId: currentSentence.id
      }
    })

    const result = executeValidator(validator, { selectedTokenIds: ["t1"] }, sentence)

    expect(result).toEqual({
      correct: false,
      score: 1,
      mistakes: [],
      breakdown: {
        sentenceId: sentence.id
      }
    })
  })

  test("executeValidator blocks validator mutation of inputs", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const userInput = { selectedTokenIds: ["t1"] }
    const originalInput = structuredClone(userInput)
    const originalSentence = structuredClone(sentence)

    const mutatingValidator: ModeValidator<typeof userInput> = (
      mutableInput,
      mutableSentence
    ) => {
      mutableInput.selectedTokenIds.push("t2")
      mutableSentence.text = "mutated"
      return { correct: true, score: 1, mistakes: [] }
    }

    expect(() => executeValidator(mutatingValidator, userInput, sentence)).toThrow(TypeError)
    expect(userInput).toEqual(originalInput)
    expect(sentence).toEqual(originalSentence)
  })

  test("ValidatorRegistry accepts mode-specific input contracts", () => {
    const taggingValidator: ModeValidator<{ tokenIdToPOS: Record<string, string> }> = (
      userInput
    ) => ({
      correct: Object.keys(userInput.tokenIdToPOS).length > 0,
      score: 1,
      mistakes: []
    })

    const registry: ValidatorRegistry = {
      tagging: taggingValidator
    }

    expect(typeof registry.tagging).toBe("function")
  })
})
