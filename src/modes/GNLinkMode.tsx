import { useMemo, useState } from "react";
import type { GNLinkModeUserInput, RoundAnswerConstraints, Sentence } from "../core/types";
import { SentenceRenderer } from "../ui/SentenceRenderer";
import { getGNDependents, getGNNouns } from "./modeContentSource";

type GNLinkModeProps = {
  sentence: Sentence;
  constraints: RoundAnswerConstraints;
  onSubmit: (input: GNLinkModeUserInput) => void;
};

/**
 * GN mode only captures links; validation remains in /core.
 */
export const GNLinkMode = ({ sentence, constraints, onSubmit }: GNLinkModeProps) => {
  const [dependentIdToNounId, setDependentIdToNounId] = useState<Record<string, string>>({});
  const dependentIds = getGNDependents(sentence);
  const nounIds = getGNNouns(sentence);
  const locked = useMemo(() => new Set(constraints.lockedInteractionIds), [constraints.lockedInteractionIds]);

  return (
    <section className="mode-panel">
      <h2>GN Linking</h2>
      <SentenceRenderer sentence={sentence} disabledTokenIds={constraints.lockedInteractionIds} />
      <div className="mode-grid">
        {dependentIds.map((dependentId) => (
          <label key={dependentId}>
            <span>{dependentId}</span>
            <select
              data-testid={`gn-link-${dependentId}`}
              value={dependentIdToNounId[dependentId] ?? ""}
              disabled={locked.has(dependentId)}
              onChange={(event) => {
                setDependentIdToNounId((previous) => ({
                  ...previous,
                  [dependentId]: event.target.value,
                }));
              }}
            >
              <option value="">--</option>
              {nounIds.map((nounId) => (
                <option key={nounId} value={nounId}>
                  {nounId}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          onSubmit({ dependentIdToNounId });
        }}
      >
        Submit Links
      </button>
    </section>
  );
};
