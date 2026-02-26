import type {
  AgreementModeUserInput,
  ModeValidator,
  ValidationFeedbackMessage,
  ValidationInteractionOutcome,
} from "./types";

/**
 * Agreement mode requires both gender and number to match for each noun.
 */
export const validateAgreementMode: ModeValidator<AgreementModeUserInput> = (userInput, sentence) => {
  const nounTokens = sentence.tokens.filter(
    (token) => token.partOfSpeech === "NOUN" && token.gender !== undefined && token.number !== undefined
  );

  const eligibleNounIds = userInput.eligibleNounIds ?? nounTokens.map((token) => token.id);
  const nounById = new Map(nounTokens.map((token) => [token.id, token]));

  const mistakes: string[] = [];
  const feedback: ValidationFeedbackMessage[] = [];
  const outcomes: ValidationInteractionOutcome[] = [];
  let score = 0;

  for (const nounId of eligibleNounIds) {
    const noun = nounById.get(nounId);
    if (!noun) {
      continue;
    }
    if (noun.gender === undefined || noun.number === undefined) {
      continue;
    }

    const expectedGender = noun.gender;
    const expectedNumber = noun.number;
    const receivedGender = userInput.nounIdToGender[nounId] ?? null;
    const receivedNumber = userInput.nounIdToNumber[nounId] ?? null;

    const isCorrect = receivedGender === expectedGender && receivedNumber === expectedNumber;
    if (isCorrect) {
      score += 1;
    } else {
      mistakes.push(
        `Noun ${nounId} expected ${expectedGender}/${expectedNumber} but got ${receivedGender ?? "null"}/${receivedNumber ?? "null"}`
      );
      feedback.push({
        code: "agreement.mismatch",
        level: "error",
        tokenId: nounId,
        params: {
          expectedGender,
          expectedNumber,
          receivedGender,
          receivedNumber,
        },
      });
    }

    outcomes.push({
      mode: "agreement",
      sentenceId: sentence.id,
      interactionId: nounId,
      dimension: "agreement",
      expected: `${expectedGender}/${expectedNumber}`,
      received: receivedGender === null && receivedNumber === null ? null : `${receivedGender}/${receivedNumber}`,
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
