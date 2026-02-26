import { fireEvent, render, screen } from "@testing-library/react"
import { loadSentencesFromContent, type ValidationResult } from "../core"
import StructureMode from "./StructureMode"

describe("StructureMode", () => {
  test("supports role-first selection across subject and predicate parts", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    render(
      <StructureMode
        sentence={sentence}
        onSubmit={() => {}}
        lastResult={null}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "La" }))
    expect(screen.getByText("subject: t1")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Predicate" }))
    fireEvent.click(screen.getByRole("button", { name: "est" }))

    expect(screen.getByText("subject: t1")).toBeInTheDocument()
    expect(screen.getByText("predicate: t5")).toBeInTheDocument()
  })

  test("disables token interactions when the active part is locked or pre-answered", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    render(
      <StructureMode
        sentence={sentence}
        onSubmit={() => {}}
        lastResult={null}
        lockedPartIds={["subject"]}
        preAnsweredPartIds={["predicate"]}
      />
    )

    expect(screen.getByRole("button", { name: "La" })).toBeDisabled()

    fireEvent.click(screen.getByRole("button", { name: "Predicate (Pre-answered)" }))
    expect(screen.getByRole("button", { name: "La" })).toBeDisabled()
  })

  test("shows complement disabled notice when no complement part exists", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    render(
      <StructureMode
        sentence={sentence}
        onSubmit={() => {}}
        lastResult={null}
      />
    )

    expect(screen.getByText("No complement for this sentence.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Complement (N/A)" })).toBeDisabled()
  })

  test("submits deterministic sentence-order arrays", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const submittedPayloads: Array<{
      subjectTokenIds: string[]
      predicateTokenIds: string[]
      complementTokenIds?: string[]
    }> = []
    render(
      <StructureMode
        sentence={sentence}
        onSubmit={(payload) => submittedPayloads.push(payload)}
        lastResult={null}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "petite" }))
    fireEvent.click(screen.getByRole("button", { name: "La" }))
    fireEvent.click(screen.getByRole("button", { name: "Predicate" }))
    fireEvent.click(screen.getByRole("button", { name: "belle" }))
    fireEvent.click(screen.getByRole("button", { name: "est" }))
    fireEvent.click(screen.getByRole("button", { name: "Validate Round" }))

    expect(submittedPayloads).toEqual([
      {
        subjectTokenIds: ["t1", "t2"],
        predicateTokenIds: ["t5", "t6"],
        complementTokenIds: []
      }
    ])
  })

  test("autofills structure selections when the secret trigger version changes", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const submittedPayloads: Array<{
      subjectTokenIds: string[]
      predicateTokenIds: string[]
      complementTokenIds?: string[]
    }> = []
    const { rerender } = render(
      <StructureMode
        sentence={sentence}
        onSubmit={(payload) => submittedPayloads.push(payload)}
        lastResult={null}
        secretAutofillVersion={0}
      />
    )

    rerender(
      <StructureMode
        sentence={sentence}
        onSubmit={(payload) => submittedPayloads.push(payload)}
        lastResult={null}
        secretAutofillVersion={1}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: "Validate Round" }))

    expect(submittedPayloads).toEqual([
      {
        subjectTokenIds: sentence.structure.subjectTokenIds,
        predicateTokenIds: sentence.structure.predicateTokenIds,
        complementTokenIds: sentence.structure.complementTokenIds ?? []
      }
    ])
  })

  test("renders shared validation feedback output", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const result: ValidationResult = {
      correct: false,
      score: 1,
      mistakes: ["Incorrect subject selection."]
    }

    render(
      <StructureMode
        sentence={sentence}
        onSubmit={() => {}}
        lastResult={result}
      />
    )

    expect(screen.getByText("Round correct: no")).toBeInTheDocument()
    expect(screen.getByText("Round score: 1")).toBeInTheDocument()
    expect(screen.getByText("Incorrect subject selection.")).toBeInTheDocument()
  })
})
