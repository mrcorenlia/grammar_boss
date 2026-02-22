import { calculateBaseScore, calculateRoundScore } from "./score"

describe("score module", () => {
  test("calculates base score from correct interactions with default base points", () => {
    expect(calculateBaseScore(4)).toBe(40)
  })

  test("supports configurable base points and normalizes invalid values", () => {
    expect(calculateBaseScore(3, 5)).toBe(15)
    expect(calculateBaseScore(2.8, 4.9)).toBe(8)
    expect(calculateBaseScore(-1, 5)).toBe(0)
    expect(calculateBaseScore(2, Number.NaN)).toBe(20)
  })

  test("returns base-only score when no speed bonus hook is provided", () => {
    expect(
      calculateRoundScore({
        correctInteractionCount: 3
      })
    ).toEqual({
      baseScore: 30,
      speedBonus: 0,
      totalScore: 30
    })
  })

  test("applies optional speed bonus hook using normalized context values", () => {
    const hookCalls: unknown[] = []
    const result = calculateRoundScore({
      correctInteractionCount: 3.9,
      basePointsPerCorrect: 5.2,
      elapsedMs: 1432.7,
      speedBonusHook: (context) => {
        hookCalls.push(context)
        return 7.8
      }
    })

    expect(hookCalls).toEqual([
      {
        correctInteractionCount: 3,
        basePointsPerCorrect: 5,
        baseScore: 15,
        elapsedMs: 1432
      }
    ])
    expect(result).toEqual({
      baseScore: 15,
      speedBonus: 7,
      totalScore: 22
    })
  })

  test("normalizes invalid speed bonus outputs to zero", () => {
    const negativeResult = calculateRoundScore({
      correctInteractionCount: 4,
      speedBonusHook: () => -100
    })

    const nonFiniteResult = calculateRoundScore({
      correctInteractionCount: 4,
      speedBonusHook: () => Number.POSITIVE_INFINITY
    })

    expect(negativeResult).toEqual({
      baseScore: 40,
      speedBonus: 0,
      totalScore: 40
    })
    expect(nonFiniteResult).toEqual({
      baseScore: 40,
      speedBonus: 0,
      totalScore: 40
    })
  })

  test("is deterministic and does not mutate round input", () => {
    const input = {
      correctInteractionCount: 5,
      basePointsPerCorrect: 4,
      elapsedMs: 900,
      speedBonusHook: ({ elapsedMs }: { elapsedMs: number | null }) =>
        elapsedMs !== null && elapsedMs <= 1000 ? 3 : 0
    }
    const originalInput = structuredClone({
      correctInteractionCount: input.correctInteractionCount,
      basePointsPerCorrect: input.basePointsPerCorrect,
      elapsedMs: input.elapsedMs
    })

    const firstResult = calculateRoundScore(input)
    const secondResult = calculateRoundScore(input)

    expect(firstResult).toEqual(secondResult)
    expect(firstResult).toEqual({
      baseScore: 20,
      speedBonus: 3,
      totalScore: 23
    })
    expect({
      correctInteractionCount: input.correctInteractionCount,
      basePointsPerCorrect: input.basePointsPerCorrect,
      elapsedMs: input.elapsedMs
    }).toEqual(originalInput)
  })
})
