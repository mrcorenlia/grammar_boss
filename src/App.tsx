import { useMemo, useState } from "react";
import { loadSentencesFromContent } from "./core";
import SentenceRenderer from "./ui/SentenceRenderer";
import "./App.css";

// A React "function component" is a JavaScript function that returns JSX.
// JSX looks like HTML, but it is compiled into JavaScript function calls.
function App() {
  const sentences = useMemo(() => loadSentencesFromContent(), []);
  const currentSentence = sentences[0] ?? null;
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);
  const selectedTokenIdSet = useMemo(
    () => new Set(selectedTokenIds),
    [selectedTokenIds]
  );

  const handleTokenToggle = (tokenId: string) => {
    setSelectedTokenIds((current) =>
      current.includes(tokenId)
        ? current.filter((currentId) => currentId !== tokenId)
        : [...current, tokenId]
    );
  };

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
      <h1>Grammar Boss Battle</h1>
      <p>Iteration 3 token-driven sentence rendering is in progress.</p>
      <SentenceRenderer
        sentence={currentSentence}
        selectedTokenIds={selectedTokenIdSet}
        onTokenToggle={handleTokenToggle}
      />
      <p className="selection-summary">
        Selected token ids:{" "}
        {selectedTokenIds.length > 0 ? selectedTokenIds.join(", ") : "none"}
      </p>
    </main>
  );
}

// Default export lets other files import this component as:
// import App from "./App";
export default App;
