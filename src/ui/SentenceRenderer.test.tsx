import { fireEvent, render, screen } from "@testing-library/react";
import { loadSentencesFromContent } from "../core";
import SentenceRenderer from "./SentenceRenderer";

describe("SentenceRenderer", () => {
  test("renders all tokens from content sentence data", () => {
    const sentence = loadSentencesFromContent()[0];
    expect(sentence).toBeDefined();
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.");
    }

    render(
      <SentenceRenderer
        sentence={sentence}
        selectedTokenIds={new Set<string>()}
        onTokenToggle={() => {}}
      />
    );

    const tokenButtons = screen.getAllByRole("button");
    expect(tokenButtons).toHaveLength(sentence.tokens.length);
    expect(screen.getByRole("button", { name: "La" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "." })).toBeInTheDocument();
  });

  test("binds interaction by token id and forwards the clicked token id", () => {
    const sentence = loadSentencesFromContent()[0];
    expect(sentence).toBeDefined();
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.");
    }

    const clickedIds: string[] = [];

    render(
      <SentenceRenderer
        sentence={sentence}
        selectedTokenIds={new Set<string>()}
        onTokenToggle={(tokenId) => clickedIds.push(tokenId)}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "maison" }));
    expect(clickedIds).toEqual(["t3"]);
  });

  test("selection state is token-id driven even when token order changes", () => {
    const sentence = loadSentencesFromContent()[0];
    expect(sentence).toBeDefined();
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.");
    }

    const reorderedSentence = {
      ...sentence,
      tokens: [...sentence.tokens].reverse()
    };

    render(
      <SentenceRenderer
        sentence={reorderedSentence}
        selectedTokenIds={new Set(["t3"])}
        onTokenToggle={() => {}}
      />
    );

    const selectedToken = screen.getByRole("button", { name: "maison" });
    expect(selectedToken).toHaveAttribute("data-token-id", "t3");
    expect(selectedToken).toHaveAttribute("aria-pressed", "true");

    const unselectedToken = screen.getByRole("button", { name: "La" });
    expect(unselectedToken).toHaveAttribute("data-token-id", "t1");
    expect(unselectedToken).toHaveAttribute("aria-pressed", "false");
  });
});
