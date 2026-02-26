import { useMemo, useState } from "react";
import type { RoundAnswerConstraints, Sentence, TagModeUserInput } from "../core/types";
import { SentenceRenderer } from "../ui/SentenceRenderer";

type TaggingModeProps = {
  sentence: Sentence;
  constraints: RoundAnswerConstraints;
  onSubmit: (input: TagModeUserInput) => void;
};

const partOfSpeechOptions = ["DET", "NOUN", "ADJ", "VERB", "ADV", "PRON", "ADP", "CONJ", "INTJ", "NUM", "PART", "PUNCT"];

/**
 * Tagging mode captures POS selections and delegates validation to battleEngine.
 */
export const TaggingMode = ({ sentence, constraints, onSubmit }: TaggingModeProps) => {
  const [tokenIdToPOS, setTokenIdToPOS] = useState<Record<string, string>>({});
  const locked = useMemo(() => new Set(constraints.lockedInteractionIds), [constraints.lockedInteractionIds]);

  return (
    <section className="mode-panel">
      <h2>POS Tagging</h2>
      <SentenceRenderer sentence={sentence} disabledTokenIds={constraints.lockedInteractionIds} />
      <div className="mode-grid">
        {sentence.tokens.map((token) => (
          <label key={token.id}>
            <span>{token.text}</span>
            <select
              data-testid={`tag-select-${token.id}`}
              value={tokenIdToPOS[token.id] ?? ""}
              disabled={locked.has(token.id)}
              onChange={(event) => {
                setTokenIdToPOS((previous) => ({
                  ...previous,
                  [token.id]: event.target.value,
                }));
              }}
            >
              <option value="">--</option>
              {partOfSpeechOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          onSubmit({ tokenIdToPOS });
        }}
      >
        Submit Tags
      </button>
    </section>
  );
};
