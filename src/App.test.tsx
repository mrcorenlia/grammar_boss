import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders core battle shell and supports mode switching", () => {
    render(<App />);

    expect(screen.getByText("Grammar Boss Battle")).toBeInTheDocument();
    expect(screen.getByText(/La petite maison rouge est belle/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Mode"), { target: { value: "structure" } });

    expect(screen.getByRole("button", { name: "Submit Structure" })).toBeInTheDocument();
  });
});
