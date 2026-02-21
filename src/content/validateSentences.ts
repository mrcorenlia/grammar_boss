import type { Sentence, Token } from "../core/types";

// Content validation should stay pure and deterministic.
// This function accepts raw unknown input so tests can verify malformed fixture behavior.
export const validateSentenceContent = (input: unknown): string[] => {
  if (!Array.isArray(input)) {
    return ["sentences fixture must be an array"];
  }

  const errors: string[] = [];

  input.forEach((candidate, index) => {
    errors.push(...validateSentence(candidate, index));
  });

  return errors;
};

// This validator checks only content-contract guarantees needed for Iteration 1.
// It intentionally avoids UI, engine, or mode concerns.
const validateSentence = (candidate: unknown, index: number): string[] => {
  const prefix = `sentence[${index}]`;

  if (!isRecord(candidate)) {
    return [`${prefix} must be an object`];
  }

  const errors: string[] = [];

  if (typeof candidate.id !== "string") {
    errors.push(`${prefix}.id is required`);
  }

  if (typeof candidate.text !== "string") {
    errors.push(`${prefix}.text is required`);
  }

  if (typeof candidate.difficulty !== "number" || candidate.difficulty < 1 || candidate.difficulty > 5) {
    errors.push(`${prefix}.difficulty must be a number between 1 and 5`);
  }

  if (!Array.isArray(candidate.tags)) {
    errors.push(`${prefix}.tags is required`);
  }

  if (!Array.isArray(candidate.tokens)) {
    errors.push(`${prefix}.tokens is required`);
    return errors;
  }

  const tokenIds = new Set<string>();

  candidate.tokens.forEach((token, tokenIndex) => {
    const tokenPrefix = `${prefix}.tokens[${tokenIndex}]`;

    if (!isRecord(token)) {
      errors.push(`${tokenPrefix} must be an object`);
      return;
    }

    if (typeof token.id !== "string") {
      errors.push(`${tokenPrefix}.id is required`);
      return;
    }

    // Token ids must stay unique per sentence to keep token-driven rendering stable.
    if (tokenIds.has(token.id)) {
      errors.push(`${prefix}.tokens has duplicate id \"${token.id}\"`);
      return;
    }

    tokenIds.add(token.id);
  });

  return errors;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

// Helper for typed callers that already have Sentence[] data.
export const validateTypedSentenceContent = (sentences: Sentence[]): string[] => {
  return validateSentenceContent(sentences);
};

// Small helper for unit tests that mutate one sentence in isolation.
export const cloneSentence = (sentence: Sentence): Sentence => {
  return {
    ...sentence,
    tags: [...sentence.tags],
    tokens: sentence.tokens.map((token: Token) => ({ ...token })),
    structure: {
      ...sentence.structure,
      subjectTokenIds: [...sentence.structure.subjectTokenIds],
      predicateTokenIds: [...sentence.structure.predicateTokenIds],
      complementTokenIds: sentence.structure.complementTokenIds
        ? [...sentence.structure.complementTokenIds]
        : undefined
    },
    groups: {
      gn: sentence.groups.gn.map((group) => ({
        ...group,
        adjectiveIds: group.adjectiveIds ? [...group.adjectiveIds] : undefined
      })),
      phrases: sentence.groups.phrases?.map((phrase) => ({
        ...phrase,
        tokenIds: [...phrase.tokenIds]
      }))
    }
  };
};
