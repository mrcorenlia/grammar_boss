import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sentenceOne } from "../core/testFixtures";
import { SentenceRenderer } from "./SentenceRenderer";

describe("SentenceRenderer", () => {
  it("renders sentence tokens by token ids", () => {
    render(<SentenceRenderer sentence={sentenceOne} />);

    expect(screen.getByTestId("token-t1")).toHaveTextContent("La");
    expect(screen.getByTestId("token-t3")).toHaveTextContent("maison");
  });

  it("emits token id on click", () => {
    const onTokenClick = vi.fn();

    render(<SentenceRenderer sentence={sentenceOne} onTokenClick={onTokenClick} />);

    fireEvent.click(screen.getByTestId("token-t2"));

    expect(onTokenClick).toHaveBeenCalledWith("t2");
  });
});
