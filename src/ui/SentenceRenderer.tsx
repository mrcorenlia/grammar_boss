import type { Sentence } from "../core/types";

type SentenceRendererProps = {
  sentence: Sentence;
  onTokenClick?: (tokenId: string) => void;
  selectedTokenIds?: string[];
  tokenBadges?: Record<string, string>;
  disabledTokenIds?: string[];
};

/**
 * Generic token renderer used by every mode to keep interactions token-id driven.
 */
export const SentenceRenderer = ({
  sentence,
  onTokenClick,
  selectedTokenIds = [],
  tokenBadges = {},
  disabledTokenIds = [],
}: SentenceRendererProps) => {
  const selected = new Set(selectedTokenIds);
  const disabled = new Set(disabledTokenIds);

  return (
    <div className="sentence-renderer" aria-label="Sentence Tokens">
      {sentence.tokens.map((token) => {
        const isSelected = selected.has(token.id);
        const isDisabled = disabled.has(token.id);
        return (
          <button
            key={token.id}
            data-testid={`token-${token.id}`}
            type="button"
            className={`token-chip${isSelected ? " token-chip--selected" : ""}${isDisabled ? " token-chip--disabled" : ""}`}
            onClick={() => onTokenClick?.(token.id)}
            disabled={isDisabled}
          >
            <span>{token.text}</span>
            {tokenBadges[token.id] ? <small className="token-badge">{tokenBadges[token.id]}</small> : null}
          </button>
        );
      })}
    </div>
  );
};
