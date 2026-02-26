import type { PlayerStats, Sentence, StatsBucket } from "./types"
import {
  calculateAdaptiveSentenceWeight,
  selectAdaptiveSentenceIndex
} from "./adaptiveDifficulty"

const createBucket = (
  attempts: number,
  correct: number,
  incorrect: number
): StatsBucket => ({
  attempts,
  correct,
  incorrect
})

const createPlayerStats = (byTag: PlayerStats["byTag"]): PlayerStats => ({
  totals: createBucket(0, 0, 0),
  byMode: {},
  byDimension: {},
  byTag,
  avgResponseTimeMs: null,
  timedRounds: 0,
  confusionByDimension: {}
})

const createSentence = (id: string, tags: string[], difficulty = 2): Sentence => ({
  id,
  text: id,
  difficulty,
  tags,
  tokens: [],
  structure: {
    subjectTokenIds: [],
    predicateTokenIds: []
  },
  groups: {
    gn: []
  }
})

describe("adaptiveDifficulty", () => {
  test("calculates higher weight for weak-tag sentences", () => {
    const strongAgreement = createSentence("s-strong", ["agreement"])
    const weakStructure = createSentence("s-weak", ["structure"])
    const stats = createPlayerStats({
      agreement: createBucket(10, 9, 1),
      structure: createBucket(10, 3, 7)
    })

    const strongWeight = calculateAdaptiveSentenceWeight(strongAgreement, stats)
    const weakWeight = calculateAdaptiveSentenceWeight(weakStructure, stats)

    expect(weakWeight).toBeGreaterThan(strongWeight)
  })

  test("selects the highest-weight sentence among candidates", () => {
    const sentences = [
      createSentence("s1", ["agreement"]),
      createSentence("s2", ["structure"]),
      createSentence("s3", ["gn"])
    ]
    const stats = createPlayerStats({
      agreement: createBucket(10, 9, 1),
      structure: createBucket(10, 2, 8),
      gn: createBucket(10, 8, 2)
    })

    const selected = selectAdaptiveSentenceIndex({
      sentences,
      currentSentenceIndex: 0,
      playerStats: stats
    })

    expect(selected).toBe(1)
  })

  test("breaks ties by nearest forward distance from current index", () => {
    const sentences = [
      createSentence("s1", ["agreement"]),
      createSentence("s2", ["structure"]),
      createSentence("s3", ["structure"])
    ]
    const stats = createPlayerStats({
      structure: createBucket(4, 1, 3)
    })

    const selected = selectAdaptiveSentenceIndex({
      sentences,
      currentSentenceIndex: 0,
      playerStats: stats
    })

    expect(selected).toBe(1)
  })

  test("handles empty and single-sentence pools safely", () => {
    const stats = createPlayerStats({})

    expect(
      selectAdaptiveSentenceIndex({
        sentences: [],
        currentSentenceIndex: 0,
        playerStats: stats
      })
    ).toBe(-1)

    expect(
      selectAdaptiveSentenceIndex({
        sentences: [createSentence("s-only", ["agreement"])],
        currentSentenceIndex: 0,
        playerStats: stats
      })
    ).toBe(0)
  })
})
