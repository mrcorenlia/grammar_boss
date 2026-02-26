import { fireEvent, render, screen, within } from "@testing-library/react"
import { loadSentencesFromContent, type ValidationResult } from "../core"
import GNLinkMode from "./GNLinkMode"

describe("GNLinkMode", () => {
  test("supports dependent-token to noun link assignment", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const submittedPayloads: Array<{ dependentIdToNounId: Record<string, string> }> = []
    render(
      <GNLinkMode
        sentence={sentence}
        onSubmit={(payload) => submittedPayloads.push(payload)}
        lastResult={null}
      />
    )
    const nounTargets = screen.getByRole("group", { name: "GN noun targets" })

    fireEvent.click(screen.getByRole("button", { name: "La" }))
    fireEvent.click(within(nounTargets).getByRole("button", { name: "maison" }))

    fireEvent.click(screen.getByRole("button", { name: "petite" }))
    fireEvent.click(within(nounTargets).getByRole("button", { name: "maison" }))

    fireEvent.click(screen.getByRole("button", { name: "Validate Round" }))

    expect(submittedPayloads).toEqual([
      {
        dependentIdToNounId: {
          t1: "t3",
          t2: "t3"
        }
      }
    ])
  })

  test("disables locked and pre-answered dependent tokens", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    render(
      <GNLinkMode
        sentence={sentence}
        onSubmit={() => {}}
        lastResult={null}
        lockedLinkIds={["t1"]}
        preAnsweredLinkIds={["t2"]}
      />
    )

    expect(screen.getByRole("button", { name: "La" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "petite" })).toBeDisabled()
    expect(screen.getByText("t1 (determiner): unlinked [locked]")).toBeInTheDocument()
    expect(screen.getByText("t2 (adjective): unlinked [pre-answered]")).toBeInTheDocument()
  })

  test("clears an active link and resets mode-local state on sentence change", () => {
    const firstSentence = loadSentencesFromContent()[0]
    const secondSentence = loadSentencesFromContent()[1]
    expect(firstSentence).toBeDefined()
    expect(secondSentence).toBeDefined()
    if (!firstSentence || !secondSentence) {
      throw new Error("Sentence fixtures must include at least two sentences.")
    }

    const view = render(
      <GNLinkMode
        sentence={firstSentence}
        onSubmit={() => {}}
        lastResult={null}
      />
    )
    const nounTargets = screen.getByRole("group", { name: "GN noun targets" })

    fireEvent.click(screen.getByRole("button", { name: "La" }))
    fireEvent.click(within(nounTargets).getByRole("button", { name: "maison" }))
    expect(screen.getByText("t1 (determiner): maison (t3)")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Clear Link" }))
    expect(screen.getByText("t1 (determiner): unlinked")).toBeInTheDocument()

    view.rerender(
      <GNLinkMode
        sentence={secondSentence}
        onSubmit={() => {}}
        lastResult={null}
      />
    )

    expect(screen.getByText("t1 (determiner): unlinked")).toBeInTheDocument()
    expect(screen.queryByText("petite")).not.toBeInTheDocument()
  })

  test("autofills dependent-to-noun links when secret trigger version changes", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const submittedPayloads: Array<{ dependentIdToNounId: Record<string, string> }> = []
    const { rerender } = render(
      <GNLinkMode
        sentence={sentence}
        onSubmit={(payload) => submittedPayloads.push(payload)}
        lastResult={null}
        secretAutofillVersion={0}
      />
    )

    rerender(
      <GNLinkMode
        sentence={sentence}
        onSubmit={(payload) => submittedPayloads.push(payload)}
        lastResult={null}
        secretAutofillVersion={1}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: "Validate Round" }))

    expect(submittedPayloads).toEqual([
      {
        dependentIdToNounId: {
          t1: "t3",
          t2: "t3",
          t4: "t3"
        }
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
      mistakes: ["Missing GN link."]
    }

    render(
      <GNLinkMode
        sentence={sentence}
        onSubmit={() => {}}
        lastResult={result}
      />
    )

    expect(screen.getByText("Round correct: no")).toBeInTheDocument()
    expect(screen.getByText("Round score: 1")).toBeInTheDocument()
    expect(screen.getByText("Missing GN link.")).toBeInTheDocument()
  })
})
