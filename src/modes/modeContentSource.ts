import type { Sentence, Token } from "../core/types";

/**
 * Content projection helpers keep mode UIs free from hardcoded answer keys.
 */
export const getGNDependents = (sentence: Sentence): string[] => {
  const dependentIds: string[] = [];

  for (const group of sentence.groups.gn) {
    if (group.determinerId) {
      dependentIds.push(group.determinerId);
    }
    dependentIds.push(...(group.adjectiveIds ?? []));
  }

  return dependentIds;
};

export const getGNNouns = (sentence: Sentence): string[] => {
  return [...new Set(sentence.groups.gn.map((group) => group.nounId))];
};

export const getAgreementNouns = (sentence: Sentence): Token[] => {
  return sentence.tokens.filter(
    (token) => token.partOfSpeech === "NOUN" && token.gender !== undefined && token.number !== undefined
  );
};
