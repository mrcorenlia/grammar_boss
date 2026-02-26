import type { ValidationFeedbackMessage } from "./types";

/**
 * Normalizes id arrays into a stable set comparison key.
 */
export const normalizeIdSet = (ids: string[] | undefined): string[] => {
  return [...new Set(ids ?? [])].sort();
};

export const equalIdSets = (left: string[] | undefined, right: string[] | undefined): boolean => {
  const a = normalizeIdSet(left);
  const b = normalizeIdSet(right);

  if (a.length !== b.length) {
    return false;
  }

  return a.every((value, index) => value === b[index]);
};

/**
 * Keeps feedback arrays deterministic for tests and UI rendering.
 */
export const sortFeedback = (feedback: ValidationFeedbackMessage[]): ValidationFeedbackMessage[] => {
  return [...feedback].sort((a, b) => {
    const aKey = `${a.code}:${a.tokenId ?? ""}`;
    const bKey = `${b.code}:${b.tokenId ?? ""}`;
    return aKey.localeCompare(bKey);
  });
};
