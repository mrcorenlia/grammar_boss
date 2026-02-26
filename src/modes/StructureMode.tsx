import { useMemo, useState } from "react";
import type { RoundAnswerConstraints, Sentence, StructureModeUserInput } from "../core/types";
import { SentenceRenderer } from "../ui/SentenceRenderer";

type StructureModeProps = {
  sentence: Sentence;
  constraints: RoundAnswerConstraints;
  onSubmit: (input: StructureModeUserInput) => void;
};

/**
 * Structure mode tracks token membership per sentence part.
 */
export const StructureMode = ({ sentence, constraints, onSubmit }: StructureModeProps) => {
  const lockedParts = useMemo(() => new Set(constraints.lockedInteractionIds), [constraints.lockedInteractionIds]);

  const [subjectSelection, setSubjectSelection] = useState<Record<string, boolean>>({});
  const [predicateSelection, setPredicateSelection] = useState<Record<string, boolean>>({});
  const [complementSelection, setComplementSelection] = useState<Record<string, boolean>>({});

  const collectSelected = (selection: Record<string, boolean>): string[] => {
    return Object.keys(selection).filter((tokenId) => selection[tokenId]);
  };

  const toggle = (
    tokenId: string,
    current: Record<string, boolean>,
    update: (next: Record<string, boolean>) => void,
    disabled: boolean
  ) => {
    if (disabled) {
      return;
    }
    update({
      ...current,
      [tokenId]: !current[tokenId],
    });
  };

  return (
    <section className="mode-panel">
      <h2>Sentence Structure</h2>
      <SentenceRenderer sentence={sentence} />
      <div className="structure-grid">
        {sentence.tokens.map((token) => (
          <div key={token.id} className="structure-row">
            <span>{token.text}</span>
            <label>
              <input
                aria-label={`subject-${token.id}`}
                type="checkbox"
                checked={subjectSelection[token.id] ?? false}
                disabled={lockedParts.has("subject")}
                onChange={() => toggle(token.id, subjectSelection, setSubjectSelection, lockedParts.has("subject"))}
              />
              Subject
            </label>
            <label>
              <input
                aria-label={`predicate-${token.id}`}
                type="checkbox"
                checked={predicateSelection[token.id] ?? false}
                disabled={lockedParts.has("predicate")}
                onChange={() =>
                  toggle(token.id, predicateSelection, setPredicateSelection, lockedParts.has("predicate"))
                }
              />
              Predicate
            </label>
            <label>
              <input
                aria-label={`complement-${token.id}`}
                type="checkbox"
                checked={complementSelection[token.id] ?? false}
                disabled={lockedParts.has("complement")}
                onChange={() =>
                  toggle(token.id, complementSelection, setComplementSelection, lockedParts.has("complement"))
                }
              />
              Complement
            </label>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          onSubmit({
            subjectTokenIds: collectSelected(subjectSelection),
            predicateTokenIds: collectSelected(predicateSelection),
            complementTokenIds: collectSelected(complementSelection),
          });
        }}
      >
        Submit Structure
      </button>
    </section>
  );
};
