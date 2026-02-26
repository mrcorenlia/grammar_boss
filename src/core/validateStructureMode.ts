import type {
  ModeValidator,
  StructureModeUserInput,
  ValidationFeedbackMessage,
  ValidationInteractionOutcome,
} from "./types";
import { equalIdSets, normalizeIdSet } from "./validation";

type StructurePartId = "subject" | "predicate" | "complement";

/**
 * Structure mode checks exact token sets per sentence part.
 */
export const validateStructureMode: ModeValidator<StructureModeUserInput> = (userInput, sentence) => {
  const hasComplement = (sentence.structure.complementTokenIds ?? []).length > 0;

  const allParts: StructurePartId[] = hasComplement
    ? ["subject", "predicate", "complement"]
    : ["subject", "predicate"];

  const eligibleParts = userInput.eligiblePartIds ? allParts.filter((part) => userInput.eligiblePartIds?.includes(part)) : allParts;

  const expectedByPart: Record<StructurePartId, string[]> = {
    subject: sentence.structure.subjectTokenIds,
    predicate: sentence.structure.predicateTokenIds,
    complement: sentence.structure.complementTokenIds ?? [],
  };

  const receivedByPart: Record<StructurePartId, string[]> = {
    subject: userInput.subjectTokenIds,
    predicate: userInput.predicateTokenIds,
    complement: userInput.complementTokenIds ?? [],
  };

  const mistakes: string[] = [];
  const feedback: ValidationFeedbackMessage[] = [];
  const outcomes: ValidationInteractionOutcome[] = [];
  let score = 0;

  for (const part of eligibleParts) {
    const expected = expectedByPart[part];
    const received = receivedByPart[part];
    const isCorrect = equalIdSets(received, expected);

    if (isCorrect) {
      score += 1;
    } else {
      mistakes.push(`Incorrect ${part} token set`);
      feedback.push({
        code: "structure.mismatch",
        level: "error",
        params: { part },
      });
    }

    outcomes.push({
      mode: "structure",
      sentenceId: sentence.id,
      interactionId: part,
      dimension: "structure.part",
      expected: normalizeIdSet(expected).join(","),
      received: normalizeIdSet(received).join(",") || null,
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
      eligibleCount: eligibleParts.length,
      correctCount: score,
      hasComplement,
    },
  };
};
