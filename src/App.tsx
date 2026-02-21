import { useMemo, useState } from "react";
import {
  createBattleEngine,
  loadSentencesFromContent,
  type GameMode,
  type ValidationResult
} from "./core";
import TaggingMode from "./modes/TaggingMode";
import "./App.css";

// A React "function component" is a JavaScript function that returns JSX.
// JSX looks like HTML, but it is compiled into JavaScript function calls.
function App() {
  const sentences = useMemo(() => loadSentencesFromContent(), []);
  const battleEngine = useMemo(() => createBattleEngine(), []);
  const currentSentence = sentences[0] ?? null;
  const [currentMode, setCurrentMode] = useState<GameMode>("tagging");
  const [lastResult, setLastResult] = useState<ValidationResult | null>(null);

  if (!currentSentence) {
    return (
      <main className="app">
        <h1>Grammar Boss Battle</h1>
        <p>No sentence content available.</p>
      </main>
    );
  }

  return (
    // className maps to the HTML class attribute.
    // React uses className because class is a reserved JavaScript keyword.
    <main className="app">
      {/* These nodes render like normal HTML elements in the browser. */}
      <h1>Grammar Boss Battle</h1>
      <p>Iteration 3 basic mode shell and POS interaction flow are in progress.</p>

      <section className="mode-switch" aria-label="Mode switch">
        <button
          type="button"
          className={`mode-switch__button${currentMode === "tagging" ? " is-active" : ""}`}
          onClick={() => setCurrentMode("tagging")}
        >
          Tagging
        </button>
        <button
          type="button"
          className={`mode-switch__button${currentMode === "structure" ? " is-active" : ""}`}
          onClick={() => setCurrentMode("structure")}
        >
          Structure
        </button>
        <button
          type="button"
          className={`mode-switch__button${currentMode === "gn-link" ? " is-active" : ""}`}
          onClick={() => setCurrentMode("gn-link")}
        >
          GN Link
        </button>
        <button
          type="button"
          className={`mode-switch__button${currentMode === "agreement" ? " is-active" : ""}`}
          onClick={() => setCurrentMode("agreement")}
        >
          Agreement
        </button>
      </section>

      {currentMode === "tagging" ? (
        <TaggingMode
          sentence={currentSentence}
          lastResult={lastResult}
          onSubmit={(payload) => {
            // App routes player payloads to battleEngine only.
            const result = battleEngine.validateRound({
              mode: "tagging",
              sentence: currentSentence,
              userInput: payload
            });
            setLastResult(result);
          }}
        />
      ) : (
        <section className="mode-panel">
          <h2>{currentMode} mode</h2>
          <p>This mode shell is not implemented yet.</p>
        </section>
      )}
    </main>
  );
}

// Default export lets other files import this component as:
// import App from "./App";
export default App;
