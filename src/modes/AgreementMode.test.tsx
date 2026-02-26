import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sentenceTwo } from "../core/testFixtures";
import { AgreementMode } from "./AgreementMode";

describe("AgreementMode", () => {
  it("submits noun agreement payloads", () => {
    const onSubmit = vi.fn();

    render(
      <AgreementMode
        sentence={sentenceTwo}
        constraints={{
          lockedInteractionIds: [],
          preAnsweredInteractionIds: [],
          eligibleInteractionIds: ["u2", "u6"],
        }}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByTestId("agreement-gender-u2"), { target: { value: "m" } });
    fireEvent.change(screen.getByTestId("agreement-number-u2"), { target: { value: "p" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit Agreement" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        nounIdToGender: expect.objectContaining({ u2: "m" }),
        nounIdToNumber: expect.objectContaining({ u2: "p" }),
      })
    );
  });
});
