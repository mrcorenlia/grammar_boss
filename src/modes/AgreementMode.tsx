import { useMemo, useState } from "react";
import type { AgreementModeUserInput, RoundAnswerConstraints, Sentence } from "../core/types";
import { SentenceRenderer } from "../ui/SentenceRenderer";
import { getAgreementNouns } from "./modeContentSource";

type AgreementModeProps = {
  sentence: Sentence;
  constraints: RoundAnswerConstraints;
  onSubmit: (input: AgreementModeUserInput) => void;
};

/**
 * Agreement mode gathers noun inflection choices without embedding answer keys.
 */
export const AgreementMode = ({ sentence, constraints, onSubmit }: AgreementModeProps) => {
  const [nounIdToGender, setNounIdToGender] = useState<Record<string, string>>({});
  const [nounIdToNumber, setNounIdToNumber] = useState<Record<string, string>>({});
  const nouns = getAgreementNouns(sentence);
  const locked = useMemo(() => new Set(constraints.lockedInteractionIds), [constraints.lockedInteractionIds]);

  return (
    <section className="mode-panel">
      <h2>Gender and Number</h2>
      <SentenceRenderer sentence={sentence} disabledTokenIds={constraints.lockedInteractionIds} />
      <div className="mode-grid">
        {nouns.map((noun) => (
          <div key={noun.id} className="agreement-row">
            <span>{noun.text}</span>
            <select
              data-testid={`agreement-gender-${noun.id}`}
              value={nounIdToGender[noun.id] ?? ""}
              disabled={locked.has(noun.id)}
              onChange={(event) => {
                setNounIdToGender((previous) => ({
                  ...previous,
                  [noun.id]: event.target.value,
                }));
              }}
            >
              <option value="">--</option>
              <option value="m">Masculine</option>
              <option value="f">Feminine</option>
            </select>
            <select
              data-testid={`agreement-number-${noun.id}`}
              value={nounIdToNumber[noun.id] ?? ""}
              disabled={locked.has(noun.id)}
              onChange={(event) => {
                setNounIdToNumber((previous) => ({
                  ...previous,
                  [noun.id]: event.target.value,
                }));
              }}
            >
              <option value="">--</option>
              <option value="s">Singular</option>
              <option value="p">Plural</option>
            </select>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          onSubmit({ nounIdToGender, nounIdToNumber });
        }}
      >
        Submit Agreement
      </button>
    </section>
  );
};
