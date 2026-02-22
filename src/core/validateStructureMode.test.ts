import { loadSentencesFromContent } from "./contentRepository"
import { executeValidator } from "./validation"
import {
  validateStructureMode,
  type StructureModeUserInput
} from "./validateStructureMode"

describe("validateStructureMode", () => {
  test("returns correct=true for full-correct subject/predicate selection", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const userInput: StructureModeUserInput = {
      subjectTokenIds: [...sentence.structure.subjectTokenIds],
      predicateTokenIds: [...sentence.structure.predicateTokenIds]
    }

    const result = validateStructureMode(userInput, sentence)

    expect(result.correct).toBe(true)
    expect(result.score).toBe(2)
    expect(result.mistakes).toEqual([])
    expect(result.feedback).toEqual([])
    expect(result.interactionOutcomes).toEqual([
      expect.objectContaining({
        interactionId: "subject",
        correct: true
      }),
      expect.objectContaining({
        interactionId: "predicate",
        correct: true
      })
    ])
  })

  test("returns incorrect part feedback when one part does not match exactly", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const userInput: StructureModeUserInput = {
      subjectTokenIds: ["t1", "t2"], // missing t3 and t4
      predicateTokenIds: [...sentence.structure.predicateTokenIds]
    }

    const result = validateStructureMode(userInput, sentence)

    expect(result.correct).toBe(false)
    expect(result.score).toBe(1)
    expect(result.feedback).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "structure.incorrect_part_selection",
          level: "error",
          params: expect.objectContaining({
            partId: "subject"
          })
        })
      ])
    )
  })

  test("reports unknown token ids from structure selections", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const userInput: StructureModeUserInput = {
      subjectTokenIds: ["t1", "t999"],
      predicateTokenIds: [...sentence.structure.predicateTokenIds]
    }

    const result = validateStructureMode(userInput, sentence)

    expect(result.correct).toBe(false)
    expect(result.feedback).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "structure.unknown_token",
          tokenId: "t999",
          params: expect.objectContaining({
            partId: "subject"
          })
        })
      ])
    )
  })

  test("treats complement as non-required when sentence has no complement", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const userInput: StructureModeUserInput = {
      subjectTokenIds: [...sentence.structure.subjectTokenIds],
      predicateTokenIds: [...sentence.structure.predicateTokenIds],
      complementTokenIds: ["t1"] // ignored because no complement is applicable
    }

    const result = validateStructureMode(userInput, sentence)

    expect(result.correct).toBe(true)
    expect(result.score).toBe(2)
    expect(result.breakdown).toMatchObject({
      applicablePartIds: ["subject", "predicate"],
      eligiblePartIds: ["subject", "predicate"]
    })
    expect(result.interactionOutcomes).toHaveLength(2)
  })

  test("evaluates only eligiblePartIds when provided", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const userInput: StructureModeUserInput = {
      subjectTokenIds: [...sentence.structure.subjectTokenIds],
      predicateTokenIds: [],
      eligiblePartIds: ["subject"]
    }

    const result = validateStructureMode(userInput, sentence)

    expect(result.correct).toBe(true)
    expect(result.score).toBe(1)
    expect(result.feedback).toEqual([])
    expect(result.interactionOutcomes).toEqual([
      expect.objectContaining({
        interactionId: "subject",
        correct: true
      })
    ])
  })

  test("is deterministic and does not mutate arguments", () => {
    const sentence = loadSentencesFromContent()[1]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least two sentences.")
    }

    const userInput: StructureModeUserInput = {
      subjectTokenIds: [...sentence.structure.subjectTokenIds],
      predicateTokenIds: [...sentence.structure.predicateTokenIds]
    }
    const originalSentence = structuredClone(sentence)
    const originalInput = structuredClone(userInput)

    const firstResult = validateStructureMode(userInput, sentence)
    const secondResult = validateStructureMode(userInput, sentence)
    const guardedResult = executeValidator(validateStructureMode, userInput, sentence)

    expect(firstResult).toEqual(secondResult)
    expect(guardedResult).toEqual(firstResult)
    expect(sentence).toEqual(originalSentence)
    expect(userInput).toEqual(originalInput)
  })
})
