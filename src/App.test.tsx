import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  test("renders mode switch container", () => {
    render(<App />);
    expect(screen.getByLabelText("Mode switch")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tagging" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Structure" })).toBeInTheDocument();
  });

  test("supports POS interaction flow and shows battleEngine-driven result", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "maison" }));
    fireEvent.click(screen.getByRole("button", { name: "NOUN" }));
    fireEvent.click(screen.getByRole("button", { name: "Validate Round" }));

    expect(screen.getByText("Round correct: no")).toBeInTheDocument();
    expect(screen.getByText("Round score: 10")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mistakes" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Mistakes list" })).toBeInTheDocument();
  });

  test("switches modes in the mode shell container", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Structure" }));
    expect(screen.getByText("structure mode")).toBeInTheDocument();
    expect(screen.getByText("This mode shell is not implemented yet.")).toBeInTheDocument();
  });
});
