import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sentenceOne } from "../core/testFixtures";
import { TaggingMode } from "./TaggingMode";

describe("TaggingMode", () => {
  it("submits token-id keyed POS map", () => {
    const onSubmit = vi.fn();

    render(
      <TaggingMode
        sentence={sentenceOne}
        constraints={{
          lockedInteractionIds: [],
          preAnsweredInteractionIds: [],
          eligibleInteractionIds: sentenceOne.tokens.map((token) => token.id),
        }}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByTestId("tag-select-t1"), { target: { value: "DET" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit Tags" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenIdToPOS: expect.objectContaining({ t1: "DET" }),
      })
    );
  });
});
