import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { loadSentencesFromContent } from "./core";
import App from "./App";

describe("App", () => {
  test("renders mode switch container", () => {
    render(<App />);
    expect(screen.getByLabelText("Boss HP")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Boss HP progress" })).toBeInTheDocument();
    expect(screen.getByText("Sentence 1 of 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Mode switch")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tagging" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Structure" })).toBeInTheDocument();
  });

  test("advances sentences and locks solved interactions when a sentence repeats", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "maison" }));
    fireEvent.click(screen.getByRole("button", { name: "NOUN" }));
    fireEvent.click(screen.getByRole("button", { name: "Validate Round" }));

    expect(screen.getByText("Round correct: no")).toBeInTheDocument();
    expect(screen.getByText("Round score: 10")).toBeInTheDocument();
    expect(screen.getByText("170 / 180 HP")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next Sentence" })).toBeInTheDocument();
    expect(screen.getByText("Sentence 1 of 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next Sentence" }));

    expect(screen.getByRole("button", { name: "enfants" })).toBeInTheDocument();
    expect(screen.getByText("Sentence 2 of 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Validate Round" }));

    expect(screen.getByText("170 / 180 HP")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next Sentence" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next Sentence" }));

    const maisonButton = screen.getByRole("button", { name: "maison" });
    expect(maisonButton).toBeDisabled();
    expect(screen.getByText("Sentence 1 of 2")).toBeInTheDocument();
  });

  test("secret click on the Battle B autofills current sentence and advances round", () => {
    render(<App />);

    fireEvent.click(screen.getByTestId("secret-autofill-trigger"));
    fireEvent.click(screen.getByRole("button", { name: "Validate Round" }));

    expect(screen.getByText("40 / 180 HP")).toBeInTheDocument();
    expect(screen.getByText("Round correct: yes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next Sentence" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next Sentence" }));
    expect(screen.getByRole("button", { name: "enfants" })).toBeInTheDocument();
    expect(screen.getByText("Sentence 2 of 2")).toBeInTheDocument();
  });

  test("applies flash/shake and persistent crack classes from boss damage events", () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<App />);

      const renderer = screen.getByLabelText("Boss renderer");
      const hornLeft = container.querySelector("g#horn_left");
      expect(hornLeft).not.toBeNull();
      expect(hornLeft).not.toHaveClass("is-cracked");

      fireEvent.click(screen.getByRole("button", { name: "maison" }));
      fireEvent.click(screen.getByRole("button", { name: "NOUN" }));
      fireEvent.click(screen.getByRole("button", { name: "Validate Round" }));

      expect(renderer).toHaveClass("is-flashing");
      expect(renderer).toHaveClass("is-shaking");
      expect(hornLeft).toHaveClass("is-cracked");

      act(() => {
        vi.advanceTimersByTime(180);
      });
      expect(renderer).not.toHaveClass("is-flashing");
      expect(renderer).toHaveClass("is-shaking");

      act(() => {
        vi.advanceTimersByTime(120);
      });
      expect(renderer).not.toHaveClass("is-shaking");

      fireEvent.click(screen.getByRole("button", { name: "Next Sentence" }));
      fireEvent.click(screen.getByRole("button", { name: "Validate Round" }));
      expect(hornLeft).toHaveClass("is-cracked");
    } finally {
      vi.useRealTimers();
    }
  });

  test("disables Validate Round when the boss is defeated", () => {
    const sentences = loadSentencesFromContent();
    expect(sentences.length).toBeGreaterThanOrEqual(2);

    render(<App />);

    fireEvent.click(screen.getByTestId("secret-autofill-trigger"));
    fireEvent.click(screen.getByRole("button", { name: "Validate Round" }));
    fireEvent.click(screen.getByRole("button", { name: "Next Sentence" }));
    fireEvent.click(screen.getByTestId("secret-autofill-trigger"));
    fireEvent.click(screen.getByRole("button", { name: "Validate Round" }));

    expect(screen.getByText("0 / 180 HP")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Validate Round" })).toBeDisabled();
  });

  test("supports structure mode interaction flow through battleEngine", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Structure" }));

    expect(screen.getByRole("heading", { name: "Structure Mode" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "La" }));
    fireEvent.click(screen.getByRole("button", { name: "petite" }));
    fireEvent.click(screen.getByRole("button", { name: "maison" }));
    fireEvent.click(screen.getByRole("button", { name: "rouge" }));
    fireEvent.click(screen.getByRole("button", { name: "Predicate" }));
    fireEvent.click(screen.getByRole("button", { name: "est" }));
    fireEvent.click(screen.getByRole("button", { name: "belle" }));
    fireEvent.click(screen.getByRole("button", { name: "Validate Round" }));

    expect(screen.getByText("Round correct: yes")).toBeInTheDocument();
    expect(screen.getByText("Round score: 40")).toBeInTheDocument();
    expect(screen.getByText("140 / 180 HP")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next Sentence" }));
    expect(screen.getByText("Sentence 2 of 2")).toBeInTheDocument();
  });

  test("supports GN link mode interaction flow through battleEngine", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "GN Link" }));

    expect(screen.getByRole("heading", { name: "GN Link Mode" })).toBeInTheDocument();
    const nounTargets = screen.getByRole("group", { name: "GN noun targets" });
    fireEvent.click(screen.getByRole("button", { name: "La" }));
    fireEvent.click(within(nounTargets).getByRole("button", { name: "maison" }));
    fireEvent.click(screen.getByRole("button", { name: "petite" }));
    fireEvent.click(within(nounTargets).getByRole("button", { name: "maison" }));
    fireEvent.click(screen.getByRole("button", { name: "rouge" }));
    fireEvent.click(within(nounTargets).getByRole("button", { name: "maison" }));
    fireEvent.click(screen.getByRole("button", { name: "Validate Round" }));

    expect(screen.getByText("Round correct: yes")).toBeInTheDocument();
    expect(screen.getByText("Round score: 60")).toBeInTheDocument();
    expect(screen.getByText("120 / 180 HP")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next Sentence" }));
    expect(screen.getByText("Sentence 2 of 2")).toBeInTheDocument();
  });

  test("supports agreement mode interaction flow through battleEngine", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Agreement" }));
    expect(screen.getByRole("heading", { name: "Agreement Mode" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "maison" }));
    fireEvent.click(screen.getByRole("button", { name: "Gender: F" }));
    fireEvent.click(screen.getByRole("button", { name: "Number: S" }));
    fireEvent.click(screen.getByRole("button", { name: "Validate Round" }));

    expect(screen.getByText("Round correct: yes")).toBeInTheDocument();
    expect(screen.getByText("Round score: 20")).toBeInTheDocument();
    expect(screen.getByText("160 / 180 HP")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next Sentence" }));
    expect(screen.getByText("Sentence 2 of 2")).toBeInTheDocument();
  });
});
