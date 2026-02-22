import { useMemo, useState } from "react";
import {
  createBattleEngine,
  loadBossesFromContent,
  loadSentencesFromContent,
  type GameMode,
  type ValidationResult
} from "./core";
import TaggingMode from "./modes/TaggingMode";
import HPBar from "./ui/HPBar";
import "./App.css";

// A React "function component" is a JavaScript function that returns JSX.
// JSX looks like HTML, but it is compiled into JavaScript function calls.
function App() {
  const sentences = useMemo(() => loadSentencesFromContent(), []);
  const bosses = useMemo(() => loadBossesFromContent(), []);
  const initialBossTemplate = bosses[0] ?? null;
  const battleEngine = useMemo(
    () =>
      createBattleEngine(
        {},
        initialBossTemplate ? { bossTemplate: initialBossTemplate } : {}
      ),
    [initialBossTemplate]
  );
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const currentSentence = sentences[sentenceIndex] ?? null;
  const [currentMode, setCurrentMode] = useState<GameMode>("tagging");
  const [lastResult, setLastResult] = useState<{
    sentenceId: string;
    result: ValidationResult;
  } | null>(null);
  const [bossState, setBossState] = useState(() => battleEngine.getState().bossState);
  const [secretAutofillVersion, setSecretAutofillVersion] = useState(0);
  const isBossDefeated = bossState?.defeated ?? false;

  const visibleResult =
    lastResult && currentSentence && lastResult.sentenceId === currentSentence.id
      ? lastResult.result
      : null;

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
      <h1>
        Grammar Boss{" "}
        <span
          className="secret-trigger"
          data-testid="secret-autofill-trigger"
          onClick={() => {
            // Only implemented modes can react to the secret trigger.
            if (currentMode === "tagging") {
              setSecretAutofillVersion((value) => value + 1);
            }
          }}
        >
          B
        </span>
        attle
      </h1>
      <p>Iteration 5 boss HP integration is complete.</p>
      <p>
        Sentence {sentenceIndex + 1} of {sentences.length}
      </p>

      <HPBar bossState={bossState} />

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
          lastResult={visibleResult}
          secretAutofillVersion={secretAutofillVersion}
          submitDisabled={isBossDefeated}
          onSubmit={(payload) => {
            if (isBossDefeated) {
              return;
            }

            // App routes player payloads to battleEngine only.
            const result = battleEngine.validateRound({
              mode: "tagging",
              sentence: currentSentence,
              userInput: payload
            });
            setLastResult({
              sentenceId: currentSentence.id,
              result
            });
            setBossState(result.bossState);
            setSentenceIndex((currentIndex) => (currentIndex + 1) % sentences.length);
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
