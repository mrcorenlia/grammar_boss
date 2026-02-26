import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sentenceOne } from "../core/testFixtures";
import { GNLinkMode } from "./GNLinkMode";

describe("GNLinkMode", () => {
  it("submits dependent->noun links", () => {
    const onSubmit = vi.fn();

    render(
      <GNLinkMode
        sentence={sentenceOne}
        constraints={{
          lockedInteractionIds: [],
          preAnsweredInteractionIds: [],
          eligibleInteractionIds: ["t1", "t2", "t4"],
        }}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByTestId("gn-link-t1"), { target: { value: "t3" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit Links" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        dependentIdToNounId: expect.objectContaining({ t1: "t3" }),
      })
    );
  });
});
