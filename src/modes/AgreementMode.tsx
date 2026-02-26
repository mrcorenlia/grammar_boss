import { useEffect, useMemo, useState } from "react"
import type { AgreementModeUserInput, Sentence, ValidationResult } from "../core"
import SentenceRenderer from "../ui/SentenceRenderer"
import ValidationFeedback from "../ui/ValidationFeedback"

type AgreementModeProps = {
  sentence: Sentence
  onSubmit: (payload: AgreementModeUserInput) => void
  lastResult: ValidationResult | null
  secretAutofillVersion?: number
  submitDisabled?: boolean
  lockedNounIds?: string[]
  preAnsweredNounIds?: string[]
}

type AgreementNoun = {
  nounId: string
  nounText: string
}
const EMPTY_INTERACTION_IDS: string[] = []

const listAgreementNouns = (sentence: Sentence): AgreementNoun[] =>
  sentence.tokens.flatMap((token) => {
    if (
      token.partOfSpeech !== "NOUN" ||
      (token.gender !== "m" && token.gender !== "f") ||
      (token.number !== "s" && token.number !== "p")
    ) {
      return []
    }

    return [
      {
        nounId: token.id,
        nounText: token.text
      }
    ]
  })

function AgreementMode({
  sentence,
  onSubmit,
  lastResult,
  secretAutofillVersion = 0,
  submitDisabled = false,
  lockedNounIds = EMPTY_INTERACTION_IDS,
  preAnsweredNounIds = EMPTY_INTERACTION_IDS
}: AgreementModeProps) {
  const [activeNounId, setActiveNounId] = useState<string | null>(null)
  const [nounIdToGender, setNounIdToGender] = useState<Record<string, string>>({})
  const [nounIdToNumber, setNounIdToNumber] = useState<Record<string, string>>({})

  const agreementNouns = useMemo(() => listAgreementNouns(sentence), [sentence])
  const answerableNounIdSet = useMemo(
    () => new Set(agreementNouns.map((noun) => noun.nounId)),
    [agreementNouns]
  )
  const disabledNounIds = useMemo(
    () => new Set([...lockedNounIds, ...preAnsweredNounIds]),
    [lockedNounIds, preAnsweredNounIds]
  )

  const selectedTokenIds = useMemo(() => {
    const selected = new Set<string>()

    for (const nounId of Object.keys(nounIdToGender)) {
      if (answerableNounIdSet.has(nounId) && !disabledNounIds.has(nounId)) {
        selected.add(nounId)
      }
    }
    for (const nounId of Object.keys(nounIdToNumber)) {
      if (answerableNounIdSet.has(nounId) && !disabledNounIds.has(nounId)) {
        selected.add(nounId)
      }
    }
    if (
      activeNounId &&
      answerableNounIdSet.has(activeNounId) &&
      !disabledNounIds.has(activeNounId)
    ) {
      selected.add(activeNounId)
    }

    return selected
  }, [activeNounId, answerableNounIdSet, disabledNounIds, nounIdToGender, nounIdToNumber])

  const disabledTokenIds = useMemo(() => {
    const disabled = new Set<string>()
    for (const token of sentence.tokens) {
      if (
        !answerableNounIdSet.has(token.id) ||
        disabledNounIds.has(token.id) ||
        submitDisabled
      ) {
        disabled.add(token.id)
      }
    }

    return disabled
  }, [answerableNounIdSet, disabledNounIds, sentence.tokens, submitDisabled])

  const activeNoun = useMemo(
    () => agreementNouns.find((noun) => noun.nounId === activeNounId) ?? null,
    [activeNounId, agreementNouns]
  )

  const activeNounDisabled =
    !activeNoun || submitDisabled || disabledNounIds.has(activeNoun.nounId)

  const handleTokenToggle = (tokenId: string) => {
    if (
      submitDisabled ||
      disabledNounIds.has(tokenId) ||
      !answerableNounIdSet.has(tokenId)
    ) {
      return
    }

    setActiveNounId((current) => (current === tokenId ? null : tokenId))
  }

  const handleAssignGender = (gender: "m" | "f") => {
    if (activeNounDisabled) {
      return
    }

    setNounIdToGender((current) => ({
      ...current,
      [activeNoun.nounId]: gender
    }))
  }

  const handleAssignNumber = (number: "s" | "p") => {
    if (activeNounDisabled) {
      return
    }

    setNounIdToNumber((current) => ({
      ...current,
      [activeNoun.nounId]: number
    }))
  }

  const handleClearActiveNoun = () => {
    if (activeNounDisabled) {
      return
    }

    setNounIdToGender((current) => {
      const next = { ...current }
      delete next[activeNoun.nounId]
      return next
    })
    setNounIdToNumber((current) => {
      const next = { ...current }
      delete next[activeNoun.nounId]
      return next
    })
  }

  const handleSubmit = () => {
    const filteredNounIdToGender = Object.fromEntries(
      Object.entries(nounIdToGender).filter(
        ([nounId, gender]) =>
          answerableNounIdSet.has(nounId) &&
          !disabledNounIds.has(nounId) &&
          (gender === "m" || gender === "f")
      )
    )
    const filteredNounIdToNumber = Object.fromEntries(
      Object.entries(nounIdToNumber).filter(
        ([nounId, number]) =>
          answerableNounIdSet.has(nounId) &&
          !disabledNounIds.has(nounId) &&
          (number === "s" || number === "p")
      )
    )

    onSubmit({
      nounIdToGender: filteredNounIdToGender,
      nounIdToNumber: filteredNounIdToNumber
    })
  }

  useEffect(() => {
    if (secretAutofillVersion <= 0) {
      return
    }

    // Easter egg helper: prefill noun agreement answers from sentence token data.
    const nextNounIdToGender: Record<string, string> = {}
    const nextNounIdToNumber: Record<string, string> = {}

    for (const noun of agreementNouns) {
      if (disabledNounIds.has(noun.nounId)) {
        continue
      }

      const token = sentence.tokens.find((item) => item.id === noun.nounId)
      if (!token) {
        continue
      }

      if (token.gender === "m" || token.gender === "f") {
        nextNounIdToGender[noun.nounId] = token.gender
      }
      if (token.number === "s" || token.number === "p") {
        nextNounIdToNumber[noun.nounId] = token.number
      }
    }

    setNounIdToGender(nextNounIdToGender)
    setNounIdToNumber(nextNounIdToNumber)
    setActiveNounId(null)
  }, [agreementNouns, disabledNounIds, secretAutofillVersion, sentence.tokens])

  useEffect(() => {
    // Each sentence starts with fresh mode-local agreement selections.
    setActiveNounId(null)
    setNounIdToGender({})
    setNounIdToNumber({})
  }, [sentence.id])

  return (
    <section className="mode-panel" aria-label="Agreement mode">
      <h2>Agreement Mode</h2>

      {agreementNouns.length === 0 ? (
        <p className="agreement-note">No answerable nouns with gender+number in this sentence.</p>
      ) : null}

      <SentenceRenderer
        sentence={sentence}
        selectedTokenIds={selectedTokenIds}
        disabledTokenIds={disabledTokenIds}
        onTokenToggle={handleTokenToggle}
      />

      <div className="agreement-controls">
        <p>
          Active noun: {activeNoun ? `${activeNoun.nounText} (${activeNoun.nounId})` : "none"}
        </p>

        <div className="agreement-buttons" role="group" aria-label="Agreement controls">
          <button
            type="button"
            className="pos-option"
            onClick={() => handleAssignGender("m")}
            disabled={activeNounDisabled}
          >
            Gender: M
          </button>
          <button
            type="button"
            className="pos-option"
            onClick={() => handleAssignGender("f")}
            disabled={activeNounDisabled}
          >
            Gender: F
          </button>
          <button
            type="button"
            className="pos-option"
            onClick={() => handleAssignNumber("s")}
            disabled={activeNounDisabled}
          >
            Number: S
          </button>
          <button
            type="button"
            className="pos-option"
            onClick={() => handleAssignNumber("p")}
            disabled={activeNounDisabled}
          >
            Number: P
          </button>
          <button
            type="button"
            className="pos-option"
            onClick={handleClearActiveNoun}
            disabled={activeNounDisabled}
          >
            Clear
          </button>
        </div>

        <button
          type="button"
          className="submit-round"
          onClick={handleSubmit}
          disabled={submitDisabled}
        >
          Validate Round
        </button>
      </div>

      <div className="tagging-summary" aria-label="Agreement summary">
        <h3>Current Agreement</h3>
        <ul>
          {agreementNouns.map((noun) => {
            const selectedGender = nounIdToGender[noun.nounId] ?? "-"
            const selectedNumber = nounIdToNumber[noun.nounId] ?? "-"
            return (
              <li key={noun.nounId}>
                {noun.nounId}: gender={selectedGender}, number={selectedNumber}
                {lockedNounIds.includes(noun.nounId) ? " [locked]" : ""}
                {preAnsweredNounIds.includes(noun.nounId) ? " [pre-answered]" : ""}
              </li>
            )
          })}
        </ul>
      </div>

      <ValidationFeedback result={lastResult} />
    </section>
  )
}

export default AgreementMode
