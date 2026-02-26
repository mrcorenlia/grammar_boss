import type {
  AnswerTrackingState,
  GameMode,
  PlayerStats,
  RoundAnswerConstraints,
  Sentence,
  StatsBucket,
  ValidationResult,
} from "./types";

const buildKey = (mode: GameMode, sentenceId: string, interactionId: string): string => {
  return `${mode}:${sentenceId}:${interactionId}`;
};

const cloneBucket = (bucket?: StatsBucket): StatsBucket => {
  return bucket ? { ...bucket } : { attempts: 0, correct: 0, incorrect: 0 };
};

const incrementBucket = (bucket: StatsBucket, correct: boolean): StatsBucket => {
  return {
    attempts: bucket.attempts + 1,
    correct: bucket.correct + (correct ? 1 : 0),
    incorrect: bucket.incorrect + (correct ? 0 : 1),
  };
};

export const createInitialPlayerStats = (): PlayerStats => ({
  totals: { attempts: 0, correct: 0, incorrect: 0 },
  byMode: {},
  byDimension: {},
  byTag: {},
  avgResponseTimeMs: null,
  timedRounds: 0,
  confusionByDimension: {},
});

export const createInitialAnswerTrackingState = (): AnswerTrackingState => ({
  solvedKeys: {},
  roundIndex: 0,
  playerStats: createInitialPlayerStats(),
});

/**
 * Every mode advertises interaction ids so engine constraints can stay mode-agnostic.
 */
export const deriveInteractionIds = (mode: GameMode, sentence: Sentence): string[] => {
  if (mode === "tagging") {
    return sentence.tokens.map((token) => token.id);
  }

  if (mode === "structure") {
    const interactionIds: string[] = ["subject", "predicate"];
    if ((sentence.structure.complementTokenIds ?? []).length > 0) {
      interactionIds.push("complement");
    }
    return interactionIds;
  }

  if (mode === "gn-link") {
    const ids: string[] = [];
    for (const group of sentence.groups.gn) {
      if (group.determinerId) {
        ids.push(group.determinerId);
      }
      ids.push(...(group.adjectiveIds ?? []));
    }
    return ids;
  }

  return sentence.tokens
    .filter((token) => token.partOfSpeech === "NOUN" && token.gender !== undefined && token.number !== undefined)
    .map((token) => token.id);
};

export const getRoundConstraints = (payload: {
  mode: GameMode;
  sentence: Sentence;
  tracking: AnswerTrackingState;
}): RoundAnswerConstraints => {
  const interactionIds = deriveInteractionIds(payload.mode, payload.sentence);

  const lockedInteractionIds = interactionIds.filter((interactionId) => {
    return payload.tracking.solvedKeys[buildKey(payload.mode, payload.sentence.id, interactionId)] === true;
  });

  const lockedSet = new Set(lockedInteractionIds);
  const eligibleInteractionIds = interactionIds.filter((interactionId) => !lockedSet.has(interactionId));

  return {
    lockedInteractionIds,
    preAnsweredInteractionIds: [...lockedInteractionIds],
    eligibleInteractionIds,
  };
};

export const updateAnswerTrackingState = (
  tracking: AnswerTrackingState,
  payload: {
    mode: GameMode;
    sentence: Sentence;
    validationResult: ValidationResult;
    elapsedMs?: number;
  }
): AnswerTrackingState => {
  const nextSolvedKeys: Record<string, true> = { ...tracking.solvedKeys };

  const nextPlayerStats: PlayerStats = {
    totals: { ...tracking.playerStats.totals },
    byMode: { ...tracking.playerStats.byMode },
    byDimension: { ...tracking.playerStats.byDimension },
    byTag: { ...tracking.playerStats.byTag },
    avgResponseTimeMs: tracking.playerStats.avgResponseTimeMs,
    timedRounds: tracking.playerStats.timedRounds,
    confusionByDimension: structuredClone(tracking.playerStats.confusionByDimension),
  };

  const outcomes = payload.validationResult.interactionOutcomes ?? [];

  for (const outcome of outcomes) {
    if (outcome.correct) {
      nextSolvedKeys[buildKey(outcome.mode, outcome.sentenceId, outcome.interactionId)] = true;
    }

    nextPlayerStats.totals = incrementBucket(nextPlayerStats.totals, outcome.correct);

    const modeBucket = cloneBucket(nextPlayerStats.byMode[payload.mode]);
    nextPlayerStats.byMode[payload.mode] = incrementBucket(modeBucket, outcome.correct);

    const dimensionBucket = cloneBucket(nextPlayerStats.byDimension[outcome.dimension]);
    nextPlayerStats.byDimension[outcome.dimension] = incrementBucket(dimensionBucket, outcome.correct);

    for (const tag of payload.sentence.tags) {
      const tagBucket = cloneBucket(nextPlayerStats.byTag[tag]);
      nextPlayerStats.byTag[tag] = incrementBucket(tagBucket, outcome.correct);
    }

    if (!outcome.correct) {
      const byExpected = (nextPlayerStats.confusionByDimension[outcome.dimension] ??= {});
      const byReceived = (byExpected[outcome.expected] ??= {});
      const receivedKey = outcome.received ?? "null";
      byReceived[receivedKey] = (byReceived[receivedKey] ?? 0) + 1;
    }
  }

  if (payload.elapsedMs !== undefined) {
    const nextTimedRounds = nextPlayerStats.timedRounds + 1;
    const previousAverage = nextPlayerStats.avgResponseTimeMs;
    nextPlayerStats.avgResponseTimeMs =
      previousAverage === null
        ? payload.elapsedMs
        : Math.round((previousAverage * nextPlayerStats.timedRounds + payload.elapsedMs) / nextTimedRounds);
    nextPlayerStats.timedRounds = nextTimedRounds;
  }

  return {
    solvedKeys: nextSolvedKeys,
    roundIndex: tracking.roundIndex + 1,
    playerStats: nextPlayerStats,
  };
};
