import { useEffect, useMemo, useRef, useState } from "react";
import { useBossVisualState } from "./animation/useBossVisualState";
import { createBossStateFromTemplate } from "./boss/BossModel";
import { BossRenderer } from "./boss/BossRenderer";
import { contentRepository, createBattleEngine, selectAdaptiveSentenceIndex } from "./core";
import type { GameMode, RoundResult } from "./core";
import { AgreementMode } from "./modes/AgreementMode";
import { GNLinkMode } from "./modes/GNLinkMode";
import { StructureMode } from "./modes/StructureMode";
import { TaggingMode } from "./modes/TaggingMode";
import { HPBar } from "./ui/HPBar";
import { Timer } from "./ui/Timer";
import { ValidationFeedback } from "./ui/ValidationFeedback";

const modeOptions: Array<{ value: GameMode; label: string }> = [
  { value: "tagging", label: "POS Tagging" },
  { value: "structure", label: "Structure" },
  { value: "gn-link", label: "GN Linking" },
  { value: "agreement", label: "Agreement" },
];

/**
 * App composes UI modules around the engine without leaking validation logic into modes.
 */
export const App = () => {
  const sentences = useMemo(() => contentRepository.getSentences(), []);
  const bossTemplate = useMemo(() => contentRepository.getBossTemplates()[0], []);
  const initialSentence = sentences[0];

  if (!bossTemplate || !initialSentence) {
    throw new Error("Content repository is missing required sentences or boss templates");
  }

  const engineRef = useRef(
    createBattleEngine({
      sentence: initialSentence,
      mode: "tagging",
      bossState: createBossStateFromTemplate(bossTemplate),
    })
  );

  const [mode, setMode] = useState<GameMode>("tagging");
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const roundStartMsRef = useRef(Date.now());

  const currentSentence = sentences[currentSentenceIndex] ?? initialSentence;
  const battleState = engineRef.current.getState();

  const constraints = engineRef.current.getRoundConstraints({
    mode,
    sentence: currentSentence,
  });

  const visualState = useBossVisualState({
    bossState: battleState.bossState,
    bossEvents: roundResult?.bossEvents ?? [],
  });

  useEffect(() => {
    const handle = window.setInterval(() => {
      setElapsedMs(Date.now() - roundStartMsRef.current);
    }, 100);

    return () => {
      window.clearInterval(handle);
    };
  }, []);

  useEffect(() => {
    roundStartMsRef.current = Date.now();
    setElapsedMs(0);
  }, [currentSentenceIndex, mode]);

  const submitRound = (userInput: unknown) => {
    const result = engineRef.current.submitRound({
      mode,
      sentence: currentSentence,
      userInput,
      elapsedMs,
    });

    setRoundResult(result);

    const nextAdaptiveIndex = selectAdaptiveSentenceIndex({
      sentences,
      currentSentenceIndex,
      playerStats: result.playerStats,
    });

    const nextIndex =
      sentences.length > 1 && nextAdaptiveIndex === currentSentenceIndex
        ? (currentSentenceIndex + 1) % sentences.length
        : nextAdaptiveIndex;

    setCurrentSentenceIndex(nextIndex);
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Grammar Boss Battle</h1>
        <label>
          <span>Mode</span>
          <select aria-label="Mode" value={mode} onChange={(event) => setMode(event.target.value as GameMode)}>
            {modeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      <section className="hud-grid">
        <div>
          <HPBar current={battleState.bossState?.totalHP ?? 0} max={battleState.bossState?.maxHP ?? 1} />
          <div className="hud-stats">
            <span>Score: {battleState.scoreState.total}</span>
            <span>
              Combo: {battleState.comboState.streak} ({battleState.comboState.multiplier}x)
            </span>
          </div>
        </div>
        <Timer elapsedMs={elapsedMs} />
      </section>

      {battleState.bossState ? <BossRenderer bossState={battleState.bossState} visualState={visualState} /> : null}

      <section className="sentence-panel">
        <h2>Sentence</h2>
        <p>{currentSentence.text}</p>
      </section>

      {mode === "tagging" ? (
        <TaggingMode sentence={currentSentence} constraints={constraints} onSubmit={submitRound} />
      ) : null}
      {mode === "structure" ? (
        <StructureMode sentence={currentSentence} constraints={constraints} onSubmit={submitRound} />
      ) : null}
      {mode === "gn-link" ? (
        <GNLinkMode sentence={currentSentence} constraints={constraints} onSubmit={submitRound} />
      ) : null}
      {mode === "agreement" ? (
        <AgreementMode sentence={currentSentence} constraints={constraints} onSubmit={submitRound} />
      ) : null}

      <ValidationFeedback result={roundResult} />

      {battleState.bossState?.defeated ? <p className="victory-banner">Boss defeated!</p> : null}
    </main>
  );
};
