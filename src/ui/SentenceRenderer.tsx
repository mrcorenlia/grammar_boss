import type { Sentence } from "../core";

type SentenceRendererProps = {
  sentence: Sentence;
  selectedTokenIds: ReadonlySet<string>;
  onTokenToggle: (tokenId: string) => void;
};

// Token-driven renderer used by UI modes.
// Interaction identity is always token.id (never array index).
function SentenceRenderer({
  sentence,
  selectedTokenIds,
  onTokenToggle
}: SentenceRendererProps) {
  return (
    <section className="sentence-renderer" aria-label="Sentence tokens">
      {sentence.tokens.map((token) => {
        const isSelected = selectedTokenIds.has(token.id);
        return (
          <button
            key={token.id}
            type="button"
            className={`token-chip${isSelected ? " token-chip--selected" : ""}`}
            data-token-id={token.id}
            aria-pressed={isSelected}
            onClick={() => onTokenToggle(token.id)}
          >
            {token.text}
          </button>
        );
      })}
    </section>
  );
}

export default SentenceRenderer;
