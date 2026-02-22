import { getValidationMistakeMessages, type ValidationResult } from "../core";

type ValidationFeedbackProps = {
  result: ValidationResult | null;
};

// Shared feedback block for mode shells.
// This component is display-only: it renders engine output without performing
// any validation, which keeps validation logic out of /modes.
function ValidationFeedback({ result }: ValidationFeedbackProps) {
  if (!result) {
    return null;
  }

  const mistakeMessages = getValidationMistakeMessages(result);

  return (
    <section className="validation-feedback" aria-label="Validation feedback" aria-live="polite">
      <p>Round correct: {result.correct ? "yes" : "no"}</p>
      <p>Round score: {result.score}</p>
      <h3>Mistakes</h3>
      {mistakeMessages.length > 0 ? (
        <ul aria-label="Mistakes list">
          {mistakeMessages.map((mistake, index) => (
            <li key={`${mistake}-${index}`}>{mistake}</li>
          ))}
        </ul>
      ) : (
        <p>None</p>
      )}
    </section>
  );
}

export default ValidationFeedback;
