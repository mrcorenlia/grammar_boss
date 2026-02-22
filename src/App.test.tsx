import { fireEvent, render, screen } from "@testing-library/react";
import { loadSentencesFromContent } from "./core";
import App from "./App";

describe("App", () => {
  test("renders mode switch container", () => {
    render(<App />);
    expect(screen.getByLabelText("Boss HP")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Boss HP progress" })).toBeInTheDocument();
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
    expect(screen.getByText("170 / 180 HP")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mistakes" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Mistakes list" })).toBeInTheDocument();
  });

  test("secret click on the Battle B autofills correct answers for tagging mode", () => {
    const sentence = loadSentencesFromContent()[0];
    expect(sentence).toBeDefined();
    if (!sentence) {
      throw new Error("Sentence fixture must include at least one sentence.");
    }

    render(<App />);

    fireEvent.click(screen.getByTestId("secret-autofill-trigger"));
    fireEvent.click(screen.getByRole("button", { name: "Validate Round" }));

    expect(screen.getByText("Round correct: yes")).toBeInTheDocument();
    expect(
      screen.getByText(`Round score: ${sentence.tokens.length * 20}`)
    ).toBeInTheDocument();
  });

  test("switches modes in the mode shell container", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Structure" }));
    expect(screen.getByText("structure mode")).toBeInTheDocument();
    expect(screen.getByText("This mode shell is not implemented yet.")).toBeInTheDocument();
  });
});
