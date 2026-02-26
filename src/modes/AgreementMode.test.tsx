import { fireEvent, render, screen } from "@testing-library/react"
import { loadSentencesFromContent, type Sentence, type ValidationResult } from "../core"
import AgreementMode from "./AgreementMode"

describe("AgreementMode", () => {
  test("supports noun agreement assignment and submit payload", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const submittedPayloads: Array<{
      nounIdToGender: Record<string, string>
      nounIdToNumber: Record<string, string>
    }> = []

    render(
      <AgreementMode
        sentence={sentence}
        onSubmit={(payload) => submittedPayloads.push(payload)}
        lastResult={null}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "maison" }))
    fireEvent.click(screen.getByRole("button", { name: "Gender: F" }))
    fireEvent.click(screen.getByRole("button", { name: "Number: S" }))
    fireEvent.click(screen.getByRole("button", { name: "Validate Round" }))

    expect(submittedPayloads).toEqual([
      {
        nounIdToGender: {
          t3: "f"
        },
        nounIdToNumber: {
          t3: "s"
        }
      }
    ])
  })

  test("disables locked and pre-answered nouns", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    render(
      <AgreementMode
        sentence={sentence}
        onSubmit={() => {}}
        lastResult={null}
        lockedNounIds={["t3"]}
      />
    )

    expect(screen.getByRole("button", { name: "maison" })).toBeDisabled()
    expect(screen.getByText("t3: gender=-, number=- [locked]")).toBeInTheDocument()
  })

  test("resets local agreement state when sentence changes", () => {
    const firstSentence = loadSentencesFromContent()[0]
    const secondSentence = loadSentencesFromContent()[1]
    expect(firstSentence).toBeDefined()
    expect(secondSentence).toBeDefined()
    if (!firstSentence || !secondSentence) {
      throw new Error("Sentence fixtures must include at least two sentences.")
    }

    const view = render(
      <AgreementMode
        sentence={firstSentence}
        onSubmit={() => {}}
        lastResult={null}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "maison" }))
    fireEvent.click(screen.getByRole("button", { name: "Gender: F" }))
    fireEvent.click(screen.getByRole("button", { name: "Number: S" }))
    expect(screen.getByText("t3: gender=f, number=s")).toBeInTheDocument()

    view.rerender(
      <AgreementMode
        sentence={secondSentence}
        onSubmit={() => {}}
        lastResult={null}
      />
    )

    expect(screen.queryByText("t3: gender=f, number=s")).not.toBeInTheDocument()
    expect(screen.getByText("t6: gender=-, number=-")).toBeInTheDocument()
  })

  test("shows non-answerable sentence note when no noun has full agreement metadata", () => {
    const sentence = structuredClone(loadSentencesFromContent()[1]) as Sentence
    expect(sentence).toBeDefined()

    for (const token of sentence.tokens) {
      if (token.id === "t6") {
        delete token.gender
      }
    }

    render(
      <AgreementMode
        sentence={sentence}
        onSubmit={() => {}}
        lastResult={null}
      />
    )

    expect(
      screen.getByText("No answerable nouns with gender+number in this sentence.")
    ).toBeInTheDocument()
  })

  test("autofills noun agreement answers when secret trigger version changes", () => {
    const sentence = loadSentencesFromContent()[0]
    expect(sentence).toBeDefined()
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.")
    }

    const submittedPayloads: Array<{
      nounIdToGender: Record<string, string>
      nounIdToNumber: Record<string, string>
    }> = []
    const { rerender } = render(
      <AgreementMode
        sentence={sentence}
        onSubmit={(payload) => submittedPayloads.push(payload)}
        lastResult={null}
        secretAutofillVersion={0}
      />
    )

    rerender(
      <AgreementMode
        sentence={sentence}
        onSubmit={(payload) => submittedPayloads.push(payload)}
        lastResult={null}
        secretAutofillVersion={1}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: "Validate Round" }))

    expect(submittedPayloads).toEqual([
      {
        nounIdToGender: {
          t3: "f"
        },
        nounIdToNumber: {
          t3: "s"
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
      score: 0,
      mistakes: ["Incorrect agreement."]
    }

    render(
      <AgreementMode
        sentence={sentence}
        onSubmit={() => {}}
        lastResult={result}
      />
    )

    expect(screen.getByText("Round correct: no")).toBeInTheDocument()
    expect(screen.getByText("Round score: 0")).toBeInTheDocument()
    expect(screen.getByText("Incorrect agreement.")).toBeInTheDocument()
  })
})
