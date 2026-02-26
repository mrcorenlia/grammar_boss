import type { PlayerStats, Sentence } from "./types";

/**
 * Weight rises as tag accuracy drops, so weaker tags are sampled more often.
 */
export const calculateAdaptiveSentenceWeight = (sentence: Sentence, playerStats: PlayerStats): number => {
  if (sentence.tags.length === 0) {
    return 1;
  }

  const weaknesses = sentence.tags.map((tag) => {
    const bucket = playerStats.byTag[tag];
    if (!bucket || bucket.attempts === 0) {
      return 0.5;
    }

    const accuracy = bucket.correct / bucket.attempts;
    return 1 - accuracy;
  });

  const averageWeakness = weaknesses.reduce((sum, value) => sum + value, 0) / weaknesses.length;
  return 1 + averageWeakness;
};

/**
 * Deterministic selector: highest weight wins, ties break by lower index.
 */
export const selectAdaptiveSentenceIndex = (input: {
  sentences: Sentence[];
  currentSentenceIndex: number;
  playerStats: PlayerStats;
}): number => {
  const { sentences, currentSentenceIndex, playerStats } = input;

  let bestIndex = currentSentenceIndex;
  let bestWeight = Number.NEGATIVE_INFINITY;

  for (let index = 0; index < sentences.length; index += 1) {
    if (index === currentSentenceIndex) {
      continue;
    }

    const candidate = sentences[index];
    if (!candidate) {
      continue;
    }
    const weight = calculateAdaptiveSentenceWeight(candidate, playerStats);

    if (weight > bestWeight) {
      bestWeight = weight;
      bestIndex = index;
    }
  }

  return bestIndex;
};
