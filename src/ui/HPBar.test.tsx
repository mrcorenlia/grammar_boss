import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HPBar } from "./HPBar";

describe("HPBar", () => {
  it("shows HP percentage and values", () => {
    render(<HPBar current={75} max={100} />);

    expect(screen.getByText("75 / 100 HP")).toBeInTheDocument();
    expect(screen.getByTestId("hp-fill")).toHaveStyle({ width: "75%" });
  });
});
