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

  test("formats no-eligible-interactions info feedback", () => {
    const message = formatValidationFeedbackMessage({
      code: "engine.no_eligible_interactions",
      level: "info",
      params: {
        mode: "tagging",
        sentenceId: "s1"
      }
    })

    expect(message).toBe(
      "No eligible interactions remain for this sentence in the current mode."
    )
  })

  test("formats structure part selection feedback", () => {
    const message = formatValidationFeedbackMessage({
      code: "structure.incorrect_part_selection",
      level: "error",
      params: {
        partId: "subject",
        expectedTokenIds: "t1|t2",
        receivedTokenIds: "t1"
      }
    })

    expect(message).toBe(
      "Incorrect subject selection: expected [t1|t2], received [t1]."
    )
  })

  test("formats structure unknown token feedback", () => {
    const message = formatValidationFeedbackMessage({
      code: "structure.unknown_token",
      level: "error",
      params: {
        partId: "predicate",
        tokenId: "t999"
      }
    })

    expect(message).toBe(
      'Received structure token id "t999" for part "predicate" that does not exist in the sentence.'
    )
  })

  test("formats GN-link incorrect-link feedback", () => {
    const message = formatValidationFeedbackMessage({
      code: "gn-link.incorrect_link",
      level: "error",
      params: {
        dependentId: "t2",
        expectedNounId: "t3",
        receivedNounId: "t6",
        linkKind: "adjective"
      }
    })

    expect(message).toBe(
      'Incorrect adjective link for token "t2": expected noun "t3", received "t6".'
    )
  })

  test("formats GN-link unknown dependent feedback", () => {
    const message = formatValidationFeedbackMessage({
      code: "gn-link.unknown_dependent",
      level: "error",
      params: {
        dependentId: "t999"
      }
    })

    expect(message).toBe('Received GN link for unknown dependent token id "t999".')
  })
})
