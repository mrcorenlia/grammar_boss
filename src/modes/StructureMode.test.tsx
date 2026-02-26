import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sentenceTwo } from "../core/testFixtures";
import { StructureMode } from "./StructureMode";

describe("StructureMode", () => {
  it("submits selected token ids by structure part", () => {
    const onSubmit = vi.fn();

    render(
      <StructureMode
        sentence={sentenceTwo}
        constraints={{
          lockedInteractionIds: [],
          preAnsweredInteractionIds: [],
          eligibleInteractionIds: ["subject", "predicate", "complement"],
        }}
        onSubmit={onSubmit}
      />
    );

    fireEvent.click(screen.getByLabelText("subject-u1"));
    fireEvent.click(screen.getByLabelText("predicate-u3"));
    fireEvent.click(screen.getByRole("button", { name: "Submit Structure" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        subjectTokenIds: ["u1"],
        predicateTokenIds: ["u3"],
      })
    );
  });
});
