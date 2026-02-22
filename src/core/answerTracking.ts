import type {
  AnswerTrackingState,
  GameMode,
  PlayerStats,
  RoundAnswerConstraints,
  Sentence,
  StatsBucket,
  ValidationInteractionOutcome
} from "./types"

type InteractionDescriptor = {
  interactionId: string
  dimension: string
  expected: string
}

export type PreAnsweredRuleContext = {
  mode: GameMode
  sentence: Sentence
  interactionId: string
  dimension: string
  expected: string
  playerStats: PlayerStats
  roundIndex: number
}

export type PreAnsweredRule = (context: PreAnsweredRuleContext) => boolean

const createInitialStatsBucket = (): StatsBucket => ({
  attempts: 0,
  correct: 0,
  incorrect: 0
})

const cloneStatsBucket = (bucket: StatsBucket): StatsBucket => ({
  attempts: bucket.attempts,
  correct: bucket.correct,
  incorrect: bucket.incorrect
})

const clonePlayerStats = (stats: PlayerStats): PlayerStats => ({
  totals: cloneStatsBucket(stats.totals),
  byMode: Object.fromEntries(
    Object.entries(stats.byMode).flatMap(([mode, bucket]) =>
      bucket ? [[mode, cloneStatsBucket(bucket)]] : []
    )
  ),
  byDimension: Object.fromEntries(
    Object.entries(stats.byDimension).map(([dimension, bucket]) => [
      dimension,
      cloneStatsBucket(bucket)
    ])
  ),
  confusionByDimension: Object.fromEntries(
    Object.entries(stats.confusionByDimension).map(([dimension, expectedMap]) => [
      dimension,
      Object.fromEntries(
        Object.entries(expectedMap).map(([expected, receivedMap]) => [
          expected,
          { ...receivedMap }
        ])
      )
    ])
  )
})

const incrementStatsBucket = (bucket: StatsBucket, correct: boolean): void => {
  bucket.attempts += 1
  if (correct) {
    bucket.correct += 1
    return
  }

  bucket.incorrect += 1
}

const listInteractionsForMode = (
  mode: GameMode,
  sentence: Sentence
): InteractionDescriptor[] => {
  if (mode === "tagging") {
    return listTaggingInteractions(sentence)
  }

  return []
}

// Stable interaction key used by round locking and historical tracking.
export const buildInteractionKey = (
  mode: GameMode,
  sentenceId: string,
  interactionId: string
): string => `${mode}:${sentenceId}:${interactionId}`

// Tagging mode interactions are token-id based POS checks.
export const listTaggingInteractions = (sentence: Sentence): InteractionDescriptor[] =>
  sentence.tokens.map((token) => ({
    interactionId: token.id,
    dimension: "partOfSpeech",
    expected: token.partOfSpeech
  }))

// Creates a fresh in-memory tracking state for a new battle.
export const createInitialAnswerTrackingState = (): AnswerTrackingState => ({
  solvedKeys: {},
  roundIndex: 0,
  playerStats: {
    totals: createInitialStatsBucket(),
    byMode: {},
    byDimension: {},
    confusionByDimension: {}
  }
})

// Computes which interactions in this round are locked, pre-answered, or eligible.
export const deriveRoundConstraints = (
  state: AnswerTrackingState,
  mode: GameMode,
  sentence: Sentence,
  preAnsweredRule?: PreAnsweredRule
): RoundAnswerConstraints => {
  const interactions = listInteractionsForMode(mode, sentence)
  const lockedInteractionIds: string[] = []
  const preAnsweredInteractionIds: string[] = []
  const eligibleInteractionIds: string[] = []
  const statsSnapshot = clonePlayerStats(state.playerStats)

  for (const interaction of interactions) {
    const interactionKey = buildInteractionKey(mode, sentence.id, interaction.interactionId)
    if (state.solvedKeys[interactionKey]) {
      lockedInteractionIds.push(interaction.interactionId)
      continue
    }

    if (
      preAnsweredRule?.({
        mode,
        sentence,
        interactionId: interaction.interactionId,
        dimension: interaction.dimension,
        expected: interaction.expected,
        playerStats: statsSnapshot,
        roundIndex: state.roundIndex
      })
    ) {
      preAnsweredInteractionIds.push(interaction.interactionId)
      continue
    }

    eligibleInteractionIds.push(interaction.interactionId)
  }

  return {
    lockedInteractionIds,
    preAnsweredInteractionIds,
    eligibleInteractionIds
  }
}

// Applies round outcomes into solved interaction keys and aggregate player stats.
export const updateAnswerTrackingState = (
  previousState: AnswerTrackingState,
  outcomes: ValidationInteractionOutcome[]
): AnswerTrackingState => {
  const nextSolvedKeys = { ...previousState.solvedKeys }
  const nextPlayerStats = clonePlayerStats(previousState.playerStats)

  for (const outcome of outcomes) {
    incrementStatsBucket(nextPlayerStats.totals, outcome.correct)

    const modeBucket =
      nextPlayerStats.byMode[outcome.mode] ?? createInitialStatsBucket()
    incrementStatsBucket(modeBucket, outcome.correct)
    nextPlayerStats.byMode[outcome.mode] = modeBucket

    const dimensionBucket =
      nextPlayerStats.byDimension[outcome.dimension] ?? createInitialStatsBucket()
    incrementStatsBucket(dimensionBucket, outcome.correct)
    nextPlayerStats.byDimension[outcome.dimension] = dimensionBucket

    if (outcome.correct) {
      const solvedKey = buildInteractionKey(
        outcome.mode,
        outcome.sentenceId,
        outcome.interactionId
      )
      nextSolvedKeys[solvedKey] = true
      continue
    }

    if (outcome.received === null) {
      continue
    }

    const confusionByExpected =
      nextPlayerStats.confusionByDimension[outcome.dimension] ??
      (nextPlayerStats.confusionByDimension[outcome.dimension] = {})
    const confusionByReceived =
      confusionByExpected[outcome.expected] ??
      (confusionByExpected[outcome.expected] = {})
    confusionByReceived[outcome.received] =
      (confusionByReceived[outcome.received] ?? 0) + 1
  }

  return {
    solvedKeys: nextSolvedKeys,
    roundIndex: previousState.roundIndex + 1,
    playerStats: nextPlayerStats
  }
}
