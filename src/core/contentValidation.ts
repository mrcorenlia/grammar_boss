// Shared validation utilities for JSON content fixtures.
// These functions are intentionally UI-agnostic and deterministic so they can
// be reused by tests, tooling, and future runtime bootstrap checks.

// One actionable content validation problem.
// `path` uses a JSONPath-like format so failures point to exact data locations.
export type ContentValidationError = {
  path: string
  message: string
}

// Aggregate result for fixture validation.
// We return all errors found instead of short-circuiting so content fixes
// can be done in one pass.
export type ContentValidationResult = {
  valid: boolean
  errors: ContentValidationError[]
}

type JsonRecord = Record<string, unknown>
const allowedPartOfSpeech = new Set([
  "DET",
  "NOUN",
  "ADJ",
  "VERB",
  "ADV",
  "PRON",
  "PREP",
  "CONJ",
  "INTJ",
  "NUM",
  "AUX",
  "PUNCT"
])

const hasOwn = (record: JsonRecord, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(record, key)

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value)

const validateStringArray = (
  value: unknown,
  path: string,
  fieldName: string,
  errors: ContentValidationError[]
): void => {
  if (!Array.isArray(value)) {
    pushError(errors, path, `Field "${fieldName}" must be an array.`)
    return
  }

  value.forEach((item, index) => {
    if (!isNonEmptyString(item)) {
      pushError(errors, `${path}[${index}]`, `Field "${fieldName}" entries must be non-empty strings.`)
    }
  })
}

const makeResult = (errors: ContentValidationError[]): ContentValidationResult => ({
  valid: errors.length === 0,
  errors
})

const pushError = (
  errors: ContentValidationError[],
  path: string,
  message: string
): void => {
  errors.push({ path, message })
}

const validateRequiredFields = (
  record: JsonRecord,
  requiredFields: string[],
  basePath: string,
  errors: ContentValidationError[]
): void => {
  for (const field of requiredFields) {
    if (!hasOwn(record, field)) {
      pushError(errors, `${basePath}.${field}`, `Missing required field "${field}".`)
    }
  }
}

// Validates sentence fixture content against Iteration 1 requirements.
// Input is `unknown` so callers can pass raw JSON safely.
export function validateSentencesContent(content: unknown): ContentValidationResult {
  const errors: ContentValidationError[] = []

  if (!Array.isArray(content)) {
    pushError(errors, "$", "Sentences content must be an array.")
    return makeResult(errors)
  }

  content.forEach((sentence, sentenceIndex) => {
    const sentencePath = `$[${sentenceIndex}]`

    if (!isRecord(sentence)) {
      pushError(errors, sentencePath, "Sentence item must be an object.")
      return
    }

    validateRequiredFields(
      sentence,
      ["id", "text", "difficulty", "tags", "tokens", "structure", "groups"],
      sentencePath,
      errors
    )

    if (hasOwn(sentence, "id") && !isNonEmptyString(sentence.id)) {
      pushError(errors, `${sentencePath}.id`, 'Field "id" must be a non-empty string.')
    }

    if (hasOwn(sentence, "text") && !isNonEmptyString(sentence.text)) {
      pushError(errors, `${sentencePath}.text`, 'Field "text" must be a non-empty string.')
    }

    if (hasOwn(sentence, "tags")) {
      validateStringArray(sentence.tags, `${sentencePath}.tags`, "tags", errors)
    }

    if (hasOwn(sentence, "difficulty")) {
      const difficulty = sentence.difficulty
      if (
        typeof difficulty !== "number" ||
        !Number.isInteger(difficulty) ||
        difficulty < 1 ||
        difficulty > 5
      ) {
        pushError(
          errors,
          `${sentencePath}.difficulty`,
          'Field "difficulty" must be an integer from 1 to 5.'
        )
      }
    }

    if (hasOwn(sentence, "tokens")) {
      const tokens = sentence.tokens
      if (!Array.isArray(tokens)) {
        pushError(errors, `${sentencePath}.tokens`, 'Field "tokens" must be an array.')
      } else {
        const seenTokenIds = new Set<string>()

        tokens.forEach((token, tokenIndex) => {
          const tokenPath = `${sentencePath}.tokens[${tokenIndex}]`

          if (!isRecord(token)) {
            pushError(errors, tokenPath, "Token must be an object.")
            return
          }

          validateRequiredFields(token, ["id", "text", "partOfSpeech"], tokenPath, errors)

          if (!hasOwn(token, "id")) {
            // Continue to collect other field errors for this token.
          } else {
            const tokenId = token.id
            if (!isNonEmptyString(tokenId)) {
              pushError(errors, `${tokenPath}.id`, 'Field "id" must be a non-empty string.')
            } else if (seenTokenIds.has(tokenId)) {
              pushError(
                errors,
                `${tokenPath}.id`,
                `Duplicate token id "${tokenId}" found in sentence "${String(sentence.id)}".`
              )
            } else {
              seenTokenIds.add(tokenId)
            }
          }

          if (hasOwn(token, "text") && !isNonEmptyString(token.text)) {
            pushError(errors, `${tokenPath}.text`, 'Field "text" must be a non-empty string.')
          }

          if (hasOwn(token, "partOfSpeech")) {
            const pos = token.partOfSpeech
            if (typeof pos !== "string" || !allowedPartOfSpeech.has(pos)) {
              pushError(errors, `${tokenPath}.partOfSpeech`, 'Field "partOfSpeech" must be a valid POS label.')
            }
          }

          if (hasOwn(token, "lemma") && !isNonEmptyString(token.lemma)) {
            pushError(errors, `${tokenPath}.lemma`, 'Field "lemma" must be a non-empty string when provided.')
          }

          if (hasOwn(token, "headId") && !isNonEmptyString(token.headId)) {
            pushError(errors, `${tokenPath}.headId`, 'Field "headId" must be a non-empty string when provided.')
          }

          if (hasOwn(token, "gender") && token.gender !== "m" && token.gender !== "f") {
            pushError(errors, `${tokenPath}.gender`, 'Field "gender" must be "m" or "f" when provided.')
          }

          if (hasOwn(token, "number") && token.number !== "s" && token.number !== "p") {
            pushError(errors, `${tokenPath}.number`, 'Field "number" must be "s" or "p" when provided.')
          }
        })
      }
    }

    if (hasOwn(sentence, "structure")) {
      const structure = sentence.structure
      if (!isRecord(structure)) {
        pushError(errors, `${sentencePath}.structure`, 'Field "structure" must be an object.')
      } else {
        validateRequiredFields(
          structure,
          ["subjectTokenIds", "predicateTokenIds"],
          `${sentencePath}.structure`,
          errors
        )

        if (hasOwn(structure, "subjectTokenIds")) {
          validateStringArray(
            structure.subjectTokenIds,
            `${sentencePath}.structure.subjectTokenIds`,
            "subjectTokenIds",
            errors
          )
        }

        if (hasOwn(structure, "predicateTokenIds")) {
          validateStringArray(
            structure.predicateTokenIds,
            `${sentencePath}.structure.predicateTokenIds`,
            "predicateTokenIds",
            errors
          )
        }

        if (hasOwn(structure, "complementTokenIds")) {
          validateStringArray(
            structure.complementTokenIds,
            `${sentencePath}.structure.complementTokenIds`,
            "complementTokenIds",
            errors
          )
        }
      }
    }

    if (hasOwn(sentence, "groups")) {
      const groups = sentence.groups
      if (!isRecord(groups)) {
        pushError(errors, `${sentencePath}.groups`, 'Field "groups" must be an object.')
      } else {
        validateRequiredFields(groups, ["gn"], `${sentencePath}.groups`, errors)

        if (hasOwn(groups, "gn")) {
          const gn = groups.gn
          if (!Array.isArray(gn)) {
            pushError(errors, `${sentencePath}.groups.gn`, 'Field "gn" must be an array.')
          } else {
            gn.forEach((group, groupIndex) => {
              const groupPath = `${sentencePath}.groups.gn[${groupIndex}]`
              if (!isRecord(group)) {
                pushError(errors, groupPath, "GN group must be an object.")
                return
              }

              validateRequiredFields(group, ["nounId"], groupPath, errors)

              if (hasOwn(group, "nounId") && !isNonEmptyString(group.nounId)) {
                pushError(errors, `${groupPath}.nounId`, 'Field "nounId" must be a non-empty string.')
              }

              if (hasOwn(group, "determinerId") && !isNonEmptyString(group.determinerId)) {
                pushError(
                  errors,
                  `${groupPath}.determinerId`,
                  'Field "determinerId" must be a non-empty string when provided.'
                )
              }

              if (hasOwn(group, "adjectiveIds")) {
                validateStringArray(group.adjectiveIds, `${groupPath}.adjectiveIds`, "adjectiveIds", errors)
              }
            })
          }
        }

        if (hasOwn(groups, "phrases")) {
          const phrases = groups.phrases
          if (!Array.isArray(phrases)) {
            pushError(errors, `${sentencePath}.groups.phrases`, 'Field "phrases" must be an array when provided.')
          } else {
            phrases.forEach((phrase, phraseIndex) => {
              const phrasePath = `${sentencePath}.groups.phrases[${phraseIndex}]`
              if (!isRecord(phrase)) {
                pushError(errors, phrasePath, "Phrase group must be an object.")
                return
              }

              if (!hasOwn(phrase, "type")) {
                pushError(errors, `${phrasePath}.type`, 'Missing required field "type".')
              } else if (phrase.type !== "prepositional") {
                pushError(errors, `${phrasePath}.type`, 'Field "type" must be "prepositional".')
              }

              if (!hasOwn(phrase, "tokenIds")) {
                pushError(errors, `${phrasePath}.tokenIds`, 'Missing required field "tokenIds".')
              } else {
                validateStringArray(phrase.tokenIds, `${phrasePath}.tokenIds`, "tokenIds", errors)
              }
            })
          }
        }
      }
    }
  })

  return makeResult(errors)
}

// Validates boss fixture content against Iteration 1 requirements.
// Keeps checks focused on required schema fields needed by upcoming iterations.
export function validateBossesContent(content: unknown): ContentValidationResult {
  const errors: ContentValidationError[] = []

  if (!Array.isArray(content)) {
    pushError(errors, "$", "Bosses content must be an array.")
    return makeResult(errors)
  }

  content.forEach((boss, bossIndex) => {
    const bossPath = `$[${bossIndex}]`

    if (!isRecord(boss)) {
      pushError(errors, bossPath, "Boss item must be an object.")
      return
    }

    validateRequiredFields(
      boss,
      ["id", "name", "baseHP", "allowedTags", "parts"],
      bossPath,
      errors
    )

    if (hasOwn(boss, "id") && !isNonEmptyString(boss.id)) {
      pushError(errors, `${bossPath}.id`, 'Field "id" must be a non-empty string.')
    }

    if (hasOwn(boss, "name") && !isNonEmptyString(boss.name)) {
      pushError(errors, `${bossPath}.name`, 'Field "name" must be a non-empty string.')
    }

    if (hasOwn(boss, "baseHP") && !isFiniteNumber(boss.baseHP)) {
      pushError(errors, `${bossPath}.baseHP`, 'Field "baseHP" must be a finite number.')
    }

    if (hasOwn(boss, "allowedTags")) {
      validateStringArray(boss.allowedTags, `${bossPath}.allowedTags`, "allowedTags", errors)
    }

    if (!hasOwn(boss, "parts")) {
      return
    }

    const parts = boss.parts
    if (!Array.isArray(parts)) {
      pushError(errors, `${bossPath}.parts`, 'Field "parts" must be an array.')
      return
    }

    parts.forEach((part, partIndex) => {
      const partPath = `${bossPath}.parts[${partIndex}]`

      if (!isRecord(part)) {
        pushError(errors, partPath, "Boss part must be an object.")
        return
      }

      validateRequiredFields(
        part,
        ["id", "name", "maxHP", "currentHP", "svgElementId"],
        partPath,
        errors
      )

      if (hasOwn(part, "id") && !isNonEmptyString(part.id)) {
        pushError(errors, `${partPath}.id`, 'Field "id" must be a non-empty string.')
      }

      if (hasOwn(part, "name") && !isNonEmptyString(part.name)) {
        pushError(errors, `${partPath}.name`, 'Field "name" must be a non-empty string.')
      }

      if (hasOwn(part, "svgElementId") && !isNonEmptyString(part.svgElementId)) {
        pushError(errors, `${partPath}.svgElementId`, 'Field "svgElementId" must be a non-empty string.')
      }

      if (hasOwn(part, "maxHP") && !isFiniteNumber(part.maxHP)) {
        pushError(errors, `${partPath}.maxHP`, 'Field "maxHP" must be a finite number.')
      }

      if (hasOwn(part, "currentHP") && !isFiniteNumber(part.currentHP)) {
        pushError(errors, `${partPath}.currentHP`, 'Field "currentHP" must be a finite number.')
      }
    })
  })

  return makeResult(errors)
}
