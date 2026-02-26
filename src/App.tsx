import { useCallback, useMemo, useState } from "react";
import {
  createBattleEngine,
  loadBossesFromContent,
  loadSentencesFromContent,
  type GameMode,
  type ValidationResult
} from "./core";
import TaggingMode from "./modes/TaggingMode";
import StructureMode from "./modes/StructureMode";
import GNLinkMode from "./modes/GNLinkMode";
import AgreementMode from "./modes/AgreementMode";
import BossRenderer from "./boss/BossRenderer";
import type { BossDamageEvent, BossPartDestroyedEvent } from "./boss/DamageSystem";
import { useBossVisualState } from "./animation/useBossVisualState";
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
    mode: GameMode;
    result: ValidationResult;
  } | null>(null);
  const [bossState, setBossState] = useState(() => battleEngine.getState().bossState);
  const [secretAutofillVersion, setSecretAutofillVersion] = useState(0);
  const [awaitingNextSentence, setAwaitingNextSentence] = useState(false);
  const [animationRoundId, setAnimationRoundId] = useState(0);
  const [lastBossEvents, setLastBossEvents] = useState<BossDamageEvent[]>([]);
  const isBossDefeated = bossState?.defeated ?? false;
  const handlePartDestroyedSound = useCallback(
    (event: BossPartDestroyedEvent) => {
      // Hook point: wire a sound effect player here in a later iteration.
      void event;
    },
    []
  );
  const bossVisualState = useBossVisualState({
    roundId: animationRoundId,
    events: lastBossEvents,
    onPartDestroyed: handlePartDestroyedSound
  });

  const visibleResult =
    lastResult &&
    currentSentence &&
    lastResult.sentenceId === currentSentence.id &&
    lastResult.mode === currentMode
      ? lastResult.result
      : null;
  const roundConstraints = useMemo(
    () =>
      currentSentence
        ? battleEngine.getRoundConstraints({
            mode: currentMode,
            sentence: currentSentence
          })
        : {
            lockedInteractionIds: [],
            preAnsweredInteractionIds: [],
            eligibleInteractionIds: []
          },
    [battleEngine, currentMode, currentSentence]
  );

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
          onClick={() => setSecretAutofillVersion((value) => value + 1)}
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
      <BossRenderer
        bossState={bossState}
        crackedPartIds={bossVisualState.crackedPartIds}
        explodingPartIds={bossVisualState.explodingPartIds}
        removedPartIds={bossVisualState.removedPartIds}
        flashActive={bossVisualState.flashActive}
        shakeActive={bossVisualState.shakeActive}
      />

      <section className="mode-switch" aria-label="Mode switch">
        <button
          type="button"
          className={`mode-switch__button${currentMode === "tagging" ? " is-active" : ""}`}
          onClick={() => setCurrentMode("tagging")}
          disabled={awaitingNextSentence}
        >
          Tagging
        </button>
        <button
          type="button"
          className={`mode-switch__button${currentMode === "structure" ? " is-active" : ""}`}
          onClick={() => setCurrentMode("structure")}
          disabled={awaitingNextSentence}
        >
          Structure
        </button>
        <button
          type="button"
          className={`mode-switch__button${currentMode === "gn-link" ? " is-active" : ""}`}
          onClick={() => setCurrentMode("gn-link")}
          disabled={awaitingNextSentence}
        >
          GN Link
        </button>
        <button
          type="button"
          className={`mode-switch__button${currentMode === "agreement" ? " is-active" : ""}`}
          onClick={() => setCurrentMode("agreement")}
          disabled={awaitingNextSentence}
        >
          Agreement
        </button>
      </section>

      {currentMode === "tagging" ? (
        <TaggingMode
          sentence={currentSentence}
          lastResult={visibleResult}
          secretAutofillVersion={secretAutofillVersion}
          submitDisabled={isBossDefeated || awaitingNextSentence}
          lockedTokenIds={roundConstraints.lockedInteractionIds}
          preAnsweredTokenIds={roundConstraints.preAnsweredInteractionIds}
          onSubmit={(payload) => {
            if (isBossDefeated || awaitingNextSentence) {
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
              mode: "tagging",
              result
            });
            setBossState(result.bossState);
            setLastBossEvents(result.bossEvents);
            setAnimationRoundId((value) => value + 1);
            setAwaitingNextSentence(!result.bossState?.defeated);
          }}
        />
      ) : currentMode === "structure" ? (
        <StructureMode
          sentence={currentSentence}
          lastResult={visibleResult}
          secretAutofillVersion={secretAutofillVersion}
          submitDisabled={isBossDefeated || awaitingNextSentence}
          lockedPartIds={roundConstraints.lockedInteractionIds}
          preAnsweredPartIds={roundConstraints.preAnsweredInteractionIds}
          onSubmit={(payload) => {
            if (isBossDefeated || awaitingNextSentence) {
              return;
            }

            const result = battleEngine.validateRound({
              mode: "structure",
              sentence: currentSentence,
              userInput: payload
            });
            setLastResult({
              sentenceId: currentSentence.id,
              mode: "structure",
              result
            });
            setBossState(result.bossState);
            setLastBossEvents(result.bossEvents);
            setAnimationRoundId((value) => value + 1);
            setAwaitingNextSentence(!result.bossState?.defeated);
          }}
        />
      ) : currentMode === "gn-link" ? (
        <GNLinkMode
          sentence={currentSentence}
          lastResult={visibleResult}
          secretAutofillVersion={secretAutofillVersion}
          submitDisabled={isBossDefeated || awaitingNextSentence}
          lockedLinkIds={roundConstraints.lockedInteractionIds}
          preAnsweredLinkIds={roundConstraints.preAnsweredInteractionIds}
          onSubmit={(payload) => {
            if (isBossDefeated || awaitingNextSentence) {
              return;
            }

            const result = battleEngine.validateRound({
              mode: "gn-link",
              sentence: currentSentence,
              userInput: payload
            });
            setLastResult({
              sentenceId: currentSentence.id,
              mode: "gn-link",
              result
            });
            setBossState(result.bossState);
            setLastBossEvents(result.bossEvents);
            setAnimationRoundId((value) => value + 1);
            setAwaitingNextSentence(!result.bossState?.defeated);
          }}
        />
      ) : currentMode === "agreement" ? (
        <AgreementMode
          sentence={currentSentence}
          lastResult={visibleResult}
          secretAutofillVersion={secretAutofillVersion}
          submitDisabled={isBossDefeated || awaitingNextSentence}
          lockedNounIds={roundConstraints.lockedInteractionIds}
          preAnsweredNounIds={roundConstraints.preAnsweredInteractionIds}
          onSubmit={(payload) => {
            if (isBossDefeated || awaitingNextSentence) {
              return;
            }

            const result = battleEngine.validateRound({
              mode: "agreement",
              sentence: currentSentence,
              userInput: payload
            });
            setLastResult({
              sentenceId: currentSentence.id,
              mode: "agreement",
              result
            });
            setBossState(result.bossState);
            setLastBossEvents(result.bossEvents);
            setAnimationRoundId((value) => value + 1);
            setAwaitingNextSentence(!result.bossState?.defeated);
          }}
        />
      ) : (
        <section className="mode-panel">
          <h2>{currentMode} mode</h2>
          <p>This mode shell is not implemented yet.</p>
        </section>
      )}

      {awaitingNextSentence && !isBossDefeated ? (
        <section className="next-sentence">
          <button
            type="button"
            className="next-sentence__button"
            onClick={() => {
              setSentenceIndex((currentIndex) => (currentIndex + 1) % sentences.length);
              setAwaitingNextSentence(false);
              setLastResult(null);
            }}
          >
            Next Sentence
          </button>
        </section>
      ) : null}
    </main>
  );
}

// Default export lets other files import this component as:
// import App from "./App";
export default App;
