import type { BossTemplate, Sentence } from "./types";

export type ContentValidationResult = {
  valid: boolean;
  errors: string[];
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
};

/**
 * Sentence validation defends core logic from malformed JSON content.
 */
export const validateSentencesContent = (value: unknown): ContentValidationResult => {
  const errors: string[] = [];

  if (!Array.isArray(value)) {
    return { valid: false, errors: ["Sentence content must be an array"] };
  }

  for (const [sentenceIndex, rawSentence] of value.entries()) {
    if (!isObject(rawSentence)) {
      errors.push(`Sentence at index ${sentenceIndex} must be an object`);
      continue;
    }

    const sentence = rawSentence as Partial<Sentence>;
    if (typeof sentence.id !== "string" || sentence.id.length === 0) {
      errors.push(`Sentence at index ${sentenceIndex} has invalid id`);
    }
    if (typeof sentence.text !== "string" || sentence.text.length === 0) {
      errors.push(`Sentence ${sentence.id ?? sentenceIndex} has invalid text`);
    }
    if (!Number.isInteger(sentence.difficulty) || (sentence.difficulty ?? 0) < 1 || (sentence.difficulty ?? 0) > 5) {
      errors.push(`Sentence ${sentence.id ?? sentenceIndex} has invalid difficulty (must be integer 1-5)`);
    }
    if (!isStringArray(sentence.tags)) {
      errors.push(`Sentence ${sentence.id ?? sentenceIndex} has invalid tags`);
    }

    if (!Array.isArray(sentence.tokens) || sentence.tokens.length === 0) {
      errors.push(`Sentence ${sentence.id ?? sentenceIndex} must contain tokens`);
      continue;
    }

    const seenTokenIds = new Set<string>();
    for (const [tokenIndex, token] of sentence.tokens.entries()) {
      if (!token || typeof token !== "object") {
        errors.push(`Sentence ${sentence.id ?? sentenceIndex} token at index ${tokenIndex} must be object`);
        continue;
      }

      if (typeof token.id !== "string" || token.id.length === 0) {
        errors.push(`Sentence ${sentence.id ?? sentenceIndex} has token with invalid id`);
      } else {
        if (seenTokenIds.has(token.id)) {
          errors.push(`Sentence ${sentence.id ?? sentenceIndex} has duplicate token id ${token.id}`);
        }
        seenTokenIds.add(token.id);
      }

      if (typeof token.text !== "string") {
        errors.push(`Sentence ${sentence.id ?? sentenceIndex} token ${tokenIndex} has invalid text`);
      }
      if (typeof token.partOfSpeech !== "string") {
        errors.push(`Sentence ${sentence.id ?? sentenceIndex} token ${token.id ?? tokenIndex} missing partOfSpeech`);
      }
    }

    if (!sentence.structure || typeof sentence.structure !== "object") {
      errors.push(`Sentence ${sentence.id ?? sentenceIndex} missing structure`);
    } else {
      if (!Array.isArray(sentence.structure.subjectTokenIds)) {
        errors.push(`Sentence ${sentence.id ?? sentenceIndex} has invalid structure.subjectTokenIds`);
      }
      if (!Array.isArray(sentence.structure.predicateTokenIds)) {
        errors.push(`Sentence ${sentence.id ?? sentenceIndex} has invalid structure.predicateTokenIds`);
      }
      if (
        sentence.structure.complementTokenIds !== undefined &&
        !Array.isArray(sentence.structure.complementTokenIds)
      ) {
        errors.push(`Sentence ${sentence.id ?? sentenceIndex} has invalid structure.complementTokenIds`);
      }
    }

    if (!sentence.groups || typeof sentence.groups !== "object") {
      errors.push(`Sentence ${sentence.id ?? sentenceIndex} missing groups`);
    } else if (!Array.isArray(sentence.groups.gn)) {
      errors.push(`Sentence ${sentence.id ?? sentenceIndex} has invalid groups.gn`);
    }

    // If base token shape is valid, check references for structural integrity.
    if (seenTokenIds.size > 0 && sentence.structure && sentence.groups?.gn) {
      const references: string[] = [
        ...(sentence.structure.subjectTokenIds ?? []),
        ...(sentence.structure.predicateTokenIds ?? []),
        ...(sentence.structure.complementTokenIds ?? []),
      ];

      for (const group of sentence.groups.gn) {
        if (group.nounId) {
          references.push(group.nounId);
        }
        if (group.determinerId) {
          references.push(group.determinerId);
        }
        for (const adjectiveId of group.adjectiveIds ?? []) {
          references.push(adjectiveId);
        }
      }

      for (const tokenId of references) {
        if (!seenTokenIds.has(tokenId)) {
          errors.push(`Sentence ${sentence.id ?? sentenceIndex} references unknown token id ${tokenId}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Boss template validation ensures damage and SVG contracts stay coherent.
 */
export const validateBossTemplatesContent = (value: unknown): ContentValidationResult => {
  const errors: string[] = [];

  if (!Array.isArray(value)) {
    return { valid: false, errors: ["Boss content must be an array"] };
  }

  for (const [bossIndex, rawBoss] of value.entries()) {
    if (!isObject(rawBoss)) {
      errors.push(`Boss at index ${bossIndex} must be an object`);
      continue;
    }

    const boss = rawBoss as Partial<BossTemplate>;
    if (typeof boss.id !== "string" || boss.id.length === 0) {
      errors.push(`Boss at index ${bossIndex} has invalid id`);
    }
    if (typeof boss.name !== "string" || boss.name.length === 0) {
      errors.push(`Boss ${boss.id ?? bossIndex} has invalid name`);
    }
    if (!Number.isFinite(boss.baseHP) || (boss.baseHP ?? 0) <= 0) {
      errors.push(`Boss ${boss.id ?? bossIndex} has invalid baseHP`);
    }
    if (!isStringArray(boss.allowedTags)) {
      errors.push(`Boss ${boss.id ?? bossIndex} has invalid allowedTags`);
    }
    if (!Array.isArray(boss.parts) || boss.parts.length === 0) {
      errors.push(`Boss ${boss.id ?? bossIndex} must include parts`);
      continue;
    }

    const partIds = new Set<string>();
    for (const [partIndex, part] of boss.parts.entries()) {
      if (!part || typeof part !== "object") {
        errors.push(`Boss ${boss.id ?? bossIndex} part ${partIndex} must be object`);
        continue;
      }
      if (typeof part.id !== "string" || part.id.length === 0) {
        errors.push(`Boss ${boss.id ?? bossIndex} part ${partIndex} has invalid id`);
      } else {
        if (partIds.has(part.id)) {
          errors.push(`Boss ${boss.id ?? bossIndex} has duplicate part id ${part.id}`);
        }
        partIds.add(part.id);
      }
      if (typeof part.name !== "string" || part.name.length === 0) {
        errors.push(`Boss ${boss.id ?? bossIndex} part ${part.id ?? partIndex} has invalid name`);
      }
      if (!Number.isFinite(part.maxHP) || (part.maxHP ?? 0) <= 0) {
        errors.push(`Boss ${boss.id ?? bossIndex} part ${part.id ?? partIndex} has invalid maxHP`);
      }
      if (!Number.isFinite(part.currentHP) || (part.currentHP ?? -1) < 0 || (part.currentHP ?? 0) > (part.maxHP ?? 0)) {
        errors.push(`Boss ${boss.id ?? bossIndex} part ${part.id ?? partIndex} has invalid currentHP`);
      }
      if (typeof part.svgElementId !== "string" || part.svgElementId.length === 0) {
        errors.push(`Boss ${boss.id ?? bossIndex} part ${part.id ?? partIndex} missing svgElementId`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
