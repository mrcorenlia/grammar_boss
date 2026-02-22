import {
  formatValidationFeedbackMessage,
  getValidationMistakeMessages
} from "./feedback"
import type { ValidationResult } from "./types"

describe("feedback helpers", () => {
  test("formats structured tagging feedback into default display text", () => {
    const message = formatValidationFeedbackMessage({
      code: "tagging.incorrect_pos",
      level: "error",
      tokenId: "t3",
      params: {
        tokenId: "t3",
        tokenText: "maison",
        expectedPOS: "NOUN",
        receivedPOS: "VERB"
      }
    })

    expect(message).toBe(
      'Incorrect POS tag for token "maison" (t3): expected NOUN, received VERB.'
    )
  })

  test("prefers structured feedback over legacy mistakes strings", () => {
    const result: ValidationResult = {
      correct: false,
      score: 0,
      mistakes: ["legacy mistake should be ignored when feedback exists"],
      feedback: [
        {
          code: "tagging.unknown_token",
          level: "error",
          tokenId: "t999",
          params: { tokenId: "t999" }
        }
      ]
    }

    expect(getValidationMistakeMessages(result)).toEqual([
      'Received POS tag for unknown token id "t999".'
    ])
  })

  test("falls back to mistakes when structured feedback is absent", () => {
    const result: ValidationResult = {
      correct: false,
      score: 1,
      mistakes: ["Legacy fallback message"]
    }

    expect(getValidationMistakeMessages(result)).toEqual(["Legacy fallback message"])
  })
})
