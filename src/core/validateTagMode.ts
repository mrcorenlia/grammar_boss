import type { ModeValidator, TagModeUserInput, ValidationFeedbackMessage, ValidationInteractionOutcome } from "./types";

/**
 * POS validation compares each eligible token's expected part of speech.
 */
export const validateTagMode: ModeValidator<TagModeUserInput> = (userInput, sentence) => {
  const eligibleIds = userInput.eligibleTokenIds ?? sentence.tokens.map((token) => token.id);
  const tokenById = new Map(sentence.tokens.map((token) => [token.id, token]));

  const mistakes: string[] = [];
  const feedback: ValidationFeedbackMessage[] = [];
  const outcomes: ValidationInteractionOutcome[] = [];
  let score = 0;

  for (const tokenId of eligibleIds) {
    const token = tokenById.get(tokenId);
    if (!token) {
      continue;
    }

    const expected = token.partOfSpeech;
    const received = userInput.tokenIdToPOS[tokenId] ?? null;
    const isCorrect = received === expected;

    if (isCorrect) {
      score += 1;
    } else {
      mistakes.push(`Token ${tokenId} expected ${expected} but got ${received ?? "null"}`);
      feedback.push({
        code: "tag.mismatch",
        level: "error",
        tokenId,
        params: { expected, received },
      });
    }

    outcomes.push({
      mode: "tagging",
      sentenceId: sentence.id,
      interactionId: tokenId,
      dimension: "partOfSpeech",
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
