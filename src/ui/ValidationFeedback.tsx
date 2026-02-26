import { formatFeedbackMessage } from "../core/feedback";
import type { ValidationResult } from "../core/types";

type ValidationFeedbackProps = {
  result: ValidationResult | null;
};

/**
 * UI adapter for normalized feedback messages from core validators.
 */
export const ValidationFeedback = ({ result }: ValidationFeedbackProps) => {
  if (!result) {
    return null;
  }

  const lines =
    result.feedback && result.feedback.length > 0
      ? result.feedback.map((message) => formatFeedbackMessage(message))
      : result.mistakes;

  return (
    <section className="validation-feedback" aria-live="polite">
      <strong>{result.correct ? "Correct" : "Try again"}</strong>
      {lines.length > 0 ? (
        <ul>
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
};
