import { useEffect, useMemo, useState } from "react";
import type { Sentence, ValidationResult } from "../core";
import { type TagModeUserInput } from "../core";
import SentenceRenderer from "../ui/SentenceRenderer";
import ValidationFeedback from "../ui/ValidationFeedback";

type TaggingModeProps = {
  sentence: Sentence;
  onSubmit: (payload: TagModeUserInput) => void;
  lastResult: ValidationResult | null;
  secretAutofillVersion: number;
  submitDisabled?: boolean;
  lockedTokenIds?: string[];
  preAnsweredTokenIds?: string[];
};

const posOptions = [
  "DET",
  "NOUN",
  "ADJ",
  "VERB",
  "ADV",
  "PRON",
  "PREP",
  "CONJ",
  "INTJ",
  "NUM",
  "AUX",
  "PUNCT"
] as const;

function TaggingMode({
  sentence,
  onSubmit,
  lastResult,
  secretAutofillVersion,
  submitDisabled = false,
  lockedTokenIds = [],
  preAnsweredTokenIds = []
}: TaggingModeProps) {
  const [activeTokenId, setActiveTokenId] = useState<string | null>(null);
  const [tokenIdToPOS, setTokenIdToPOS] = useState<Record<string, string>>({});
  const disabledTokenIds = useMemo(
    () => new Set([...lockedTokenIds, ...preAnsweredTokenIds]),
    [lockedTokenIds, preAnsweredTokenIds]
  );

  const selectedTokenIds = useMemo(
    () =>
      new Set(
        (activeTokenId ? Object.keys(tokenIdToPOS).concat(activeTokenId) : Object.keys(tokenIdToPOS))
          .filter((tokenId) => !disabledTokenIds.has(tokenId))
      ),
    [activeTokenId, disabledTokenIds, tokenIdToPOS]
  );

  const activeToken = useMemo(
    () => sentence.tokens.find((token) => token.id === activeTokenId) ?? null,
    [activeTokenId, sentence.tokens]
  );

  const handleTokenToggle = (tokenId: string) => {
    if (disabledTokenIds.has(tokenId)) {
      return;
    }

    setActiveTokenId((current) => (current === tokenId ? null : tokenId));
  };

  const handleAssignPOS = (partOfSpeech: string) => {
    if (!activeTokenId) {
      return;
    }

    setTokenIdToPOS((current) => ({
      ...current,
      [activeTokenId]: partOfSpeech
    }));
  };

  const handleSubmit = () => {
    const filteredTokenIdToPOS = Object.fromEntries(
      Object.entries(tokenIdToPOS).filter(([tokenId]) => !disabledTokenIds.has(tokenId))
    );
    onSubmit({ tokenIdToPOS: filteredTokenIdToPOS });
  };

  useEffect(() => {
    if (secretAutofillVersion <= 0) {
      return;
    }

    // Easter egg helper: prefill tags from sentence content answers.
    setTokenIdToPOS(
      Object.fromEntries(
        sentence.tokens
          .filter((token) => !disabledTokenIds.has(token.id))
          .map((token) => [token.id, token.partOfSpeech])
      )
    );
    setActiveTokenId(null);
  }, [secretAutofillVersion, sentence]);

  useEffect(() => {
    // New rounds must start with fresh mode-local selection state.
    setTokenIdToPOS({});
    setActiveTokenId(null);
  }, [sentence.id]);

  return (
    <section className="mode-panel" aria-label="Tagging mode">
      <h2>Tagging Mode</h2>
      <SentenceRenderer
        sentence={sentence}
        selectedTokenIds={selectedTokenIds}
        disabledTokenIds={disabledTokenIds}
        onTokenToggle={handleTokenToggle}
      />

      <div className="tagging-controls">
        <p>
          Active token: {activeToken ? `${activeToken.text} (${activeToken.id})` : "none"}
        </p>
        <div className="pos-options" role="group" aria-label="Part of speech options">
          {posOptions.map((option) => (
            <button
              key={option}
              type="button"
              className="pos-option"
              onClick={() => handleAssignPOS(option)}
              disabled={!activeToken}
            >
              {option}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="submit-round"
          onClick={handleSubmit}
          disabled={submitDisabled}
        >
          Validate Round
        </button>
      </div>

      <div className="tagging-summary">
        <h3>Current Tags</h3>
        <ul>
          {sentence.tokens.map((token) => (
            <li key={token.id}>
              {token.id}: {tokenIdToPOS[token.id] ?? "unassigned"}
            </li>
          ))}
        </ul>
      </div>

      <ValidationFeedback result={lastResult} />
    </section>
  );
}

export default TaggingMode;
