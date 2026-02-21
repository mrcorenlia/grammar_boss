import bossesFixture from "../content/bosses.json"
import sentencesFixture from "../content/sentences.json"
import { validateBossesContent, validateSentencesContent } from "./contentValidation"

const hasErrorAtPath = (
  errors: { path: string; message: string }[],
  expectedPathPart: string
): boolean => errors.some((error) => error.path.includes(expectedPathPart))

describe("validateSentencesContent", () => {
  test("accepts current sentences fixture", () => {
    const result = validateSentencesContent(sentencesFixture)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test("rejects duplicate token ids within one sentence", () => {
    const invalid = structuredClone(sentencesFixture) as Record<string, unknown>[]
    const firstSentence = invalid[0] as Record<string, unknown>
    const tokens = firstSentence.tokens as Record<string, unknown>[]
    const firstToken = tokens[0]
    const secondToken = tokens[1]
    expect(firstToken).toBeDefined()
    expect(secondToken).toBeDefined()
    if (!firstToken || !secondToken) {
      throw new Error("Test fixture must include at least two tokens.")
    }
    secondToken.id = firstToken.id

    const result = validateSentencesContent(invalid)

    expect(result.valid).toBe(false)
    expect(hasErrorAtPath(result.errors, ".tokens[1].id")).toBe(true)
    expect(result.errors.some((error) => error.message.includes("Duplicate token id"))).toBe(
      true
    )
  })

  test("rejects difficulty below range", () => {
    const invalid = structuredClone(sentencesFixture) as Record<string, unknown>[]
    const firstSentence = invalid[0] as Record<string, unknown>
    firstSentence.difficulty = 0

    const result = validateSentencesContent(invalid)

    expect(result.valid).toBe(false)
    expect(hasErrorAtPath(result.errors, ".difficulty")).toBe(true)
  })

  test("rejects difficulty above range", () => {
    const invalid = structuredClone(sentencesFixture) as Record<string, unknown>[]
    const firstSentence = invalid[0] as Record<string, unknown>
    firstSentence.difficulty = 6

    const result = validateSentencesContent(invalid)

    expect(result.valid).toBe(false)
    expect(hasErrorAtPath(result.errors, ".difficulty")).toBe(true)
  })

  test("rejects non-integer difficulty", () => {
    const invalid = structuredClone(sentencesFixture) as Record<string, unknown>[]
    const firstSentence = invalid[0] as Record<string, unknown>
    firstSentence.difficulty = 2.5

    const result = validateSentencesContent(invalid)

    expect(result.valid).toBe(false)
    expect(hasErrorAtPath(result.errors, ".difficulty")).toBe(true)
  })

  test("rejects missing required sentence field", () => {
    const invalid = structuredClone(sentencesFixture) as Record<string, unknown>[]
    const firstSentence = invalid[0] as Record<string, unknown>
    delete firstSentence.structure

    const result = validateSentencesContent(invalid)

    expect(result.valid).toBe(false)
    expect(hasErrorAtPath(result.errors, ".structure")).toBe(true)
    expect(
      result.errors.some((error) => error.message.includes('Missing required field "structure"'))
    ).toBe(true)
  })

  test("rejects missing required token field", () => {
    const invalid = structuredClone(sentencesFixture) as Record<string, unknown>[]
    const firstSentence = invalid[0] as Record<string, unknown>
    const tokens = firstSentence.tokens as Record<string, unknown>[]
    const firstToken = tokens[0]
    expect(firstToken).toBeDefined()
    if (!firstToken) {
      throw new Error("Test fixture must include at least one token.")
    }
    delete firstToken.partOfSpeech

    const result = validateSentencesContent(invalid)

    expect(result.valid).toBe(false)
    expect(hasErrorAtPath(result.errors, ".tokens[0].partOfSpeech")).toBe(true)
  })

  test("rejects invalid sentence schema field types", () => {
    const invalid = structuredClone(sentencesFixture) as Record<string, unknown>[]
    const firstSentence = invalid[0] as Record<string, unknown>
    firstSentence.tags = ["agreement", 7]
    firstSentence.structure = {
      subjectTokenIds: "not-an-array",
      predicateTokenIds: ["t5"]
    }

    const result = validateSentencesContent(invalid)

    expect(result.valid).toBe(false)
    expect(hasErrorAtPath(result.errors, ".tags[1]")).toBe(true)
    expect(hasErrorAtPath(result.errors, ".structure.subjectTokenIds")).toBe(true)
  })

  test("collects multiple sentence errors in one pass", () => {
    const invalid = structuredClone(sentencesFixture) as Record<string, unknown>[]
    const firstSentence = invalid[0] as Record<string, unknown>
    firstSentence.difficulty = 9
    delete firstSentence.structure
    firstSentence.tags = [1]

    const tokens = firstSentence.tokens as Record<string, unknown>[]
    const firstToken = tokens[0]
    expect(firstToken).toBeDefined()
    if (!firstToken) {
      throw new Error("Test fixture must include at least one token.")
    }
    firstToken.partOfSpeech = "INVALID_POS"

    const result = validateSentencesContent(invalid)

    expect(result.valid).toBe(false)
    expect(hasErrorAtPath(result.errors, ".difficulty")).toBe(true)
    expect(hasErrorAtPath(result.errors, ".structure")).toBe(true)
    expect(hasErrorAtPath(result.errors, ".tags[0]")).toBe(true)
    expect(hasErrorAtPath(result.errors, ".tokens[0].partOfSpeech")).toBe(true)
    expect(result.errors.length).toBeGreaterThanOrEqual(4)
  })
})

describe("validateBossesContent", () => {
  test("accepts current bosses fixture", () => {
    const result = validateBossesContent(bossesFixture)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test("rejects missing required boss field", () => {
    const invalid = structuredClone(bossesFixture) as Record<string, unknown>[]
    const firstBoss = invalid[0] as Record<string, unknown>
    delete firstBoss.baseHP

    const result = validateBossesContent(invalid)

    expect(result.valid).toBe(false)
    expect(hasErrorAtPath(result.errors, ".baseHP")).toBe(true)
  })

  test("rejects missing required boss part field", () => {
    const invalid = structuredClone(bossesFixture) as Record<string, unknown>[]
    const firstBoss = invalid[0] as Record<string, unknown>
    const parts = firstBoss.parts as Record<string, unknown>[]
    const firstPart = parts[0]
    expect(firstPart).toBeDefined()
    if (!firstPart) {
      throw new Error("Test fixture must include at least one boss part.")
    }
    delete firstPart.svgElementId

    const result = validateBossesContent(invalid)

    expect(result.valid).toBe(false)
    expect(hasErrorAtPath(result.errors, ".parts[0].svgElementId")).toBe(true)
  })

  test("rejects invalid boss and part field types", () => {
    const invalid = structuredClone(bossesFixture) as Record<string, unknown>[]
    const firstBoss = invalid[0] as Record<string, unknown>
    firstBoss.baseHP = "180"
    firstBoss.allowedTags = ["agreement", 1]

    const parts = firstBoss.parts as Record<string, unknown>[]
    const firstPart = parts[0]
    expect(firstPart).toBeDefined()
    if (!firstPart) {
      throw new Error("Test fixture must include at least one boss part.")
    }
    firstPart.maxHP = "30"

    const result = validateBossesContent(invalid)

    expect(result.valid).toBe(false)
    expect(hasErrorAtPath(result.errors, ".baseHP")).toBe(true)
    expect(hasErrorAtPath(result.errors, ".allowedTags[1]")).toBe(true)
    expect(hasErrorAtPath(result.errors, ".parts[0].maxHP")).toBe(true)
  })

  test("collects multiple boss errors in one pass", () => {
    const invalid = structuredClone(bossesFixture) as Record<string, unknown>[]
    const firstBoss = invalid[0] as Record<string, unknown>
    firstBoss.allowedTags = "invalid-tags-shape"
    delete firstBoss.name

    const parts = firstBoss.parts as Record<string, unknown>[]
    const firstPart = parts[0]
    expect(firstPart).toBeDefined()
    if (!firstPart) {
      throw new Error("Test fixture must include at least one boss part.")
    }
    firstPart.currentHP = "bad-hp"
    delete firstPart.svgElementId

    const result = validateBossesContent(invalid)

    expect(result.valid).toBe(false)
    expect(hasErrorAtPath(result.errors, ".name")).toBe(true)
    expect(hasErrorAtPath(result.errors, ".allowedTags")).toBe(true)
    expect(hasErrorAtPath(result.errors, ".parts[0].currentHP")).toBe(true)
    expect(hasErrorAtPath(result.errors, ".parts[0].svgElementId")).toBe(true)
    expect(result.errors.length).toBeGreaterThanOrEqual(4)
  })
})
