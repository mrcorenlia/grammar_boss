import { fireEvent, render, screen } from "@testing-library/react";
import { loadSentencesFromContent, type ValidationResult } from "../core";
import TaggingMode from "./TaggingMode";

describe("TaggingMode", () => {
  test("captures tagging interactions and submits token-id keyed payload", () => {
    const sentence = loadSentencesFromContent()[0];
    expect(sentence).toBeDefined();
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.");
    }

    const submittedPayloads: Array<{ tokenIdToPOS: Record<string, string> }> = [];
    render(
      <TaggingMode
        sentence={sentence}
        onSubmit={(payload) => submittedPayloads.push(payload)}
        lastResult={null}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "maison" }));
    fireEvent.click(screen.getByRole("button", { name: "NOUN" }));
    fireEvent.click(screen.getByRole("button", { name: "Validate Round" }));

    expect(submittedPayloads).toEqual([{ tokenIdToPOS: { t3: "NOUN" } }]);
  });

  test("shows round feedback supplied by engine result", () => {
    const sentence = loadSentencesFromContent()[0];
    expect(sentence).toBeDefined();
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.");
    }

    const result: ValidationResult = {
      correct: false,
      score: 2,
      mistakes: ["example"]
    };

    render(
      <TaggingMode sentence={sentence} onSubmit={() => {}} lastResult={result} />
    );

    expect(screen.getByText("Round correct: no")).toBeInTheDocument();
    expect(screen.getByText("Round score: 2")).toBeInTheDocument();
  });
});
