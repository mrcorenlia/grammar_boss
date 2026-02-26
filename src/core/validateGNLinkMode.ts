import type {
  GNLinkModeUserInput,
  ModeValidator,
  ValidationFeedbackMessage,
  ValidationInteractionOutcome,
} from "./types";

/**
 * GN link mode scores each dependent that points to the expected noun.
 */
export const validateGNLinkMode: ModeValidator<GNLinkModeUserInput> = (userInput, sentence) => {
  const expectedLinks: Record<string, string> = {};

  for (const group of sentence.groups.gn) {
    if (group.determinerId) {
      expectedLinks[group.determinerId] = group.nounId;
    }
    for (const adjectiveId of group.adjectiveIds ?? []) {
      expectedLinks[adjectiveId] = group.nounId;
    }
  }

  const dependentIds = userInput.eligibleLinkIds ?? Object.keys(expectedLinks);

  const mistakes: string[] = [];
  const feedback: ValidationFeedbackMessage[] = [];
  const outcomes: ValidationInteractionOutcome[] = [];
  let score = 0;

  for (const dependentId of dependentIds) {
    const expected = expectedLinks[dependentId];
    if (!expected) {
      continue;
    }

    const received = userInput.dependentIdToNounId[dependentId] ?? null;
    const isCorrect = received === expected;

    if (isCorrect) {
      score += 1;
    } else {
      mistakes.push(`Dependent ${dependentId} should link to ${expected} but got ${received ?? "null"}`);
      feedback.push({
        code: "gn_link.mismatch",
        level: "error",
        tokenId: dependentId,
        params: { expected, received },
      });
    }

    outcomes.push({
      mode: "gn-link",
      sentenceId: sentence.id,
      interactionId: dependentId,
      dimension: "gnLink",
      expected,
      received,
      correct: isCorrect,
    });
  }

  return {
    correct: mistakes.length === 0,
    score,
    mistakes,
    feedback,
    interactionOutcomes: outcomes,
    breakdown: {
      eligibleCount: outcomes.length,
      correctCount: score,
    },
  };
};
