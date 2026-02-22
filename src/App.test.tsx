import { fireEvent, render, screen } from "@testing-library/react";
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

    expect(screen.getByText("170 / 180 HP")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "enfants" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "maison" })).not.toBeInTheDocument();
    expect(screen.getByText("Sentence 2 of 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Validate Round" }));

    expect(screen.getByText("170 / 180 HP")).toBeInTheDocument();
    const maisonButton = screen.getByRole("button", { name: "maison" });
    expect(maisonButton).toBeDisabled();
    expect(screen.getByText("Sentence 1 of 2")).toBeInTheDocument();

    fireEvent.click(maisonButton);
    fireEvent.click(screen.getByRole("button", { name: "NOUN" }));
    fireEvent.click(screen.getByRole("button", { name: "Validate Round" }));
    expect(screen.getByText("170 / 180 HP")).toBeInTheDocument();
  });

  test("secret click on the Battle B autofills current sentence and advances round", () => {
    render(<App />);

    fireEvent.click(screen.getByTestId("secret-autofill-trigger"));
    fireEvent.click(screen.getByRole("button", { name: "Validate Round" }));

    expect(screen.getByText("40 / 180 HP")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "enfants" })).toBeInTheDocument();
    expect(screen.getByText("Sentence 2 of 2")).toBeInTheDocument();
  });

  test("disables Validate Round when the boss is defeated", () => {
    const sentences = loadSentencesFromContent();
    expect(sentences.length).toBeGreaterThanOrEqual(2);

    render(<App />);

    fireEvent.click(screen.getByTestId("secret-autofill-trigger"));
    fireEvent.click(screen.getByRole("button", { name: "Validate Round" }));
    fireEvent.click(screen.getByTestId("secret-autofill-trigger"));
    fireEvent.click(screen.getByRole("button", { name: "Validate Round" }));

    expect(screen.getByText("0 / 180 HP")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Validate Round" })).toBeDisabled();
  });

  test("switches modes in the mode shell container", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Structure" }));
    expect(screen.getByText("structure mode")).toBeInTheDocument();
    expect(screen.getByText("This mode shell is not implemented yet.")).toBeInTheDocument();
  });
});
