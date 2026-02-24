import { loadSentencesFromContent } from "./contentRepository"
import {
  buildInteractionKey,
  createInitialAnswerTrackingState,
  deriveRoundConstraints,
  listAgreementInteractions,
  listGNLinkInteractions,
  listStructureInteractions,
  updateAnswerTrackingState
} from "./answerTracking"
import type { ValidationInteractionOutcome } from "./types"

describe("answerTracking", () => {
  test("builds deterministic interaction keys using mode + sentence + interaction", () => {
    expect(buildInteractionKey("tagging", "s1", "t3")).toBe("tagging:s1:t3")
    expect(buildInteractionKey("tagging", "s1", "t3")).toBe("tagging:s1:t3")
  })

  test("derives locked interactions from previously solved answers", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const solvedOutcome: ValidationInteractionOutcome = {
      mode: "tagging",
      sentenceId: sentence.id,
      interactionId: "t1",
      dimension: "partOfSpeech",
      expected: "DET",
      received: "DET",
      correct: true
    }

    const initialState = createInitialAnswerTrackingState()
    const updatedState = updateAnswerTrackingState(initialState, [solvedOutcome])
    const constraints = deriveRoundConstraints(updatedState, "tagging", sentence)

    expect(constraints.lockedInteractionIds).toEqual(["t1"])
    expect(constraints.preAnsweredInteractionIds).toEqual([])
    expect(constraints.eligibleInteractionIds).not.toContain("t1")
    expect(constraints.eligibleInteractionIds).toContain("t2")
  })

  test("applies pre-answered rule without mutating tracking state", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const initialState = createInitialAnswerTrackingState()
    const snapshot = structuredClone(initialState)
    const constraints = deriveRoundConstraints(
      initialState,
      "tagging",
      sentence,
      ({ expected }) => expected === "DET"
    )

    expect(constraints.preAnsweredInteractionIds).toEqual(["t1"])
    expect(constraints.eligibleInteractionIds).not.toContain("t1")
    expect(initialState).toEqual(snapshot)
  })

  test("tracks per-dimension confusion and increments round index on update", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const outcomes: ValidationInteractionOutcome[] = [
      {
        mode: "tagging",
        sentenceId: sentence.id,
        interactionId: "t2",
        dimension: "partOfSpeech",
        expected: "ADJ",
        received: "ADV",
        correct: false
      },
      {
        mode: "tagging",
        sentenceId: sentence.id,
        interactionId: "t3",
        dimension: "partOfSpeech",
        expected: "NOUN",
        received: "NOUN",
        correct: true
      }
    ]

    const initialState = createInitialAnswerTrackingState()
    const snapshot = structuredClone(initialState)
    const updatedState = updateAnswerTrackingState(initialState, outcomes)

    expect(initialState).toEqual(snapshot)
    expect(updatedState.roundIndex).toBe(1)
    expect(updatedState.playerStats.totals).toEqual({
      attempts: 2,
      correct: 1,
      incorrect: 1
    })
    expect(updatedState.playerStats.byMode.tagging).toEqual({
      attempts: 2,
      correct: 1,
      incorrect: 1
    })
    expect(updatedState.playerStats.byDimension.partOfSpeech).toEqual({
      attempts: 2,
      correct: 1,
      incorrect: 1
    })
    expect(
      updatedState.playerStats.confusionByDimension.partOfSpeech?.ADJ?.ADV
    ).toBe(1)
    expect(updatedState.solvedKeys[buildInteractionKey("tagging", sentence.id, "t3")]).toBe(
      true
    )
    expect(updatedState.solvedKeys[buildInteractionKey("tagging", sentence.id, "t2")]).toBe(
      undefined
    )
  })

  test("increments round index even when no outcomes are reported", () => {
    const initialState = createInitialAnswerTrackingState()
    const nextState = updateAnswerTrackingState(initialState, [])

    expect(nextState.roundIndex).toBe(1)
    expect(nextState.playerStats).toEqual(initialState.playerStats)
    expect(nextState.solvedKeys).toEqual(initialState.solvedKeys)
  })

  test("lists structure interactions as part-level descriptors", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const interactions = listStructureInteractions(sentence)

    expect(interactions).toEqual([
      {
        interactionId: "subject",
        dimension: "sentenceStructurePart",
        expected: "t1|t2|t3|t4"
      },
      {
        interactionId: "predicate",
        dimension: "sentenceStructurePart",
        expected: "t5|t6"
      }
    ])
  })

  test("derives structure constraints and locks solved structure parts", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const solvedOutcome: ValidationInteractionOutcome = {
      mode: "structure",
      sentenceId: sentence.id,
      interactionId: "subject",
      dimension: "sentenceStructurePart",
      expected: "t1|t2|t3|t4",
      received: "t1|t2|t3|t4",
      correct: true
    }

    const state = updateAnswerTrackingState(createInitialAnswerTrackingState(), [solvedOutcome])
    const constraints = deriveRoundConstraints(state, "structure", sentence)

    expect(constraints.lockedInteractionIds).toEqual(["subject"])
    expect(constraints.eligibleInteractionIds).toEqual(["predicate"])
  })

  test("lists GN-link interactions as dependent-token descriptors", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const interactions = listGNLinkInteractions(sentence)

    expect(interactions).toEqual([
      {
        interactionId: "t1",
        dimension: "gnLinkTarget",
        expected: "t3"
      },
      {
        interactionId: "t2",
        dimension: "gnLinkTarget",
        expected: "t3"
      },
      {
        interactionId: "t4",
        dimension: "gnLinkTarget",
        expected: "t3"
      }
    ])
  })

  test("derives GN-link constraints and locks solved dependent tokens", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const solvedOutcome: ValidationInteractionOutcome = {
      mode: "gn-link",
      sentenceId: sentence.id,
      interactionId: "t1",
      dimension: "gnLinkTarget",
      expected: "t3",
      received: "t3",
      correct: true
    }

    const state = updateAnswerTrackingState(createInitialAnswerTrackingState(), [solvedOutcome])
    const constraints = deriveRoundConstraints(state, "gn-link", sentence)

    expect(constraints.lockedInteractionIds).toEqual(["t1"])
    expect(constraints.eligibleInteractionIds).toEqual(["t2", "t4"])
  })

  test("lists agreement interactions as noun-level descriptors", () => {
    const sentence = loadSentencesFromContent()[1]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least two sentences.")
    }

    const interactions = listAgreementInteractions(sentence)

    expect(interactions).toEqual([
      {
        interactionId: "t6",
        dimension: "agreementGenderNumber",
        expected: "m|s"
      }
    ])
  })

  test("derives agreement constraints and locks solved noun interactions", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const solvedOutcome: ValidationInteractionOutcome = {
      mode: "agreement",
      sentenceId: sentence.id,
      interactionId: "t3",
      dimension: "agreementGenderNumber",
      expected: "f|s",
      received: "f|s",
      correct: true
    }

    const state = updateAnswerTrackingState(createInitialAnswerTrackingState(), [solvedOutcome])
    const constraints = deriveRoundConstraints(state, "agreement", sentence)

    expect(constraints.lockedInteractionIds).toEqual(["t3"])
    expect(constraints.eligibleInteractionIds).toEqual([])
  })
})
