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
        secretAutofillVersion={0}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "maison" }));
    fireEvent.click(screen.getByRole("button", { name: "NOUN" }));
    fireEvent.click(screen.getByRole("button", { name: "Validate Round" }));

    expect(submittedPayloads).toEqual([{ tokenIdToPOS: { t3: "NOUN" } }]);
  });

  test("shows correctness, score, and mistakes from engine feedback", () => {
    const sentence = loadSentencesFromContent()[0];
    expect(sentence).toBeDefined();
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.");
    }

    const result: ValidationResult = {
      correct: false,
      score: 2,
      mistakes: ["Missing POS tag for token.", "Incorrect POS assignment for token."]
    };

    render(
      <TaggingMode
        sentence={sentence}
        onSubmit={() => {}}
        lastResult={result}
        secretAutofillVersion={0}
      />
    );

    expect(screen.getByText("Round correct: no")).toBeInTheDocument();
    expect(screen.getByText("Round score: 2")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mistakes" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Mistakes list" })).toBeInTheDocument();
    expect(screen.getByText("Missing POS tag for token.")).toBeInTheDocument();
    expect(screen.getByText("Incorrect POS assignment for token.")).toBeInTheDocument();
  });

  test("shows empty mistakes state when the round is fully correct", () => {
    const sentence = loadSentencesFromContent()[0];
    expect(sentence).toBeDefined();
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.");
    }

    const result: ValidationResult = {
      correct: true,
      score: sentence.tokens.length,
      mistakes: []
    };

    render(
      <TaggingMode
        sentence={sentence}
        onSubmit={() => {}}
        lastResult={result}
        secretAutofillVersion={0}
      />
    );

    expect(screen.getByText("Round correct: yes")).toBeInTheDocument();
    expect(screen.getByText("None")).toBeInTheDocument();
  });

  test("prefers normalized feedback messages over legacy mistakes text", () => {
    const sentence = loadSentencesFromContent()[0];
    expect(sentence).toBeDefined();
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.");
    }

    const result: ValidationResult = {
      correct: false,
      score: 0,
      mistakes: ["legacy string should not be displayed when feedback exists"],
      feedback: [
        {
          code: "tagging.unknown_token",
          level: "error",
          tokenId: "t999",
          params: { tokenId: "t999" }
        }
      ]
    };

    render(
      <TaggingMode
        sentence={sentence}
        onSubmit={() => {}}
        lastResult={result}
        secretAutofillVersion={0}
      />
    );

    expect(
      screen.getByText('Received POS tag for unknown token id "t999".')
    ).toBeInTheDocument();
    expect(
      screen.queryByText("legacy string should not be displayed when feedback exists")
    ).not.toBeInTheDocument();
  });

  test("autofills all correct tags when the secret trigger version changes", () => {
    const sentence = loadSentencesFromContent()[0];
    expect(sentence).toBeDefined();
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.");
    }

    const submittedPayloads: Array<{ tokenIdToPOS: Record<string, string> }> = [];
    const { rerender } = render(
      <TaggingMode
        sentence={sentence}
        onSubmit={(payload) => submittedPayloads.push(payload)}
        lastResult={null}
        secretAutofillVersion={0}
      />
    );

    rerender(
      <TaggingMode
        sentence={sentence}
        onSubmit={(payload) => submittedPayloads.push(payload)}
        lastResult={null}
        secretAutofillVersion={1}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Validate Round" }));

    expect(submittedPayloads).toEqual([
      {
        tokenIdToPOS: Object.fromEntries(
          sentence.tokens.map((token) => [token.id, token.partOfSpeech])
        )
      }
    ]);
  });
});
