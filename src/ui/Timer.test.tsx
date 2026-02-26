import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Timer } from "./Timer";

describe("Timer", () => {
  it("formats elapsed time and pacing class", () => {
    const { container } = render(<Timer elapsedMs={12500} />);

    expect(screen.getByText("12.5s")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("timer--good");
  });

  it("flags out-of-window pace", () => {
    const { container } = render(<Timer elapsedMs={35000} />);

    expect(container.firstChild).toHaveClass("timer--slow");
  });
});
