import { useEffect, useMemo, useState } from "react"
import type {
  Sentence,
  StructureModeUserInput,
  ValidationResult,
  StructurePartId
} from "../core"
import SentenceRenderer from "../ui/SentenceRenderer"
import ValidationFeedback from "../ui/ValidationFeedback"

type StructureModeProps = {
  sentence: Sentence
  onSubmit: (payload: StructureModeUserInput) => void
  lastResult: ValidationResult | null
  submitDisabled?: boolean
  lockedPartIds?: string[]
  preAnsweredPartIds?: string[]
}

type StructureSelections = Record<StructurePartId, Set<string>>

const STRUCTURE_PART_IDS: StructurePartId[] = ["subject", "predicate", "complement"]

const createEmptySelections = (): StructureSelections => ({
  subject: new Set<string>(),
  predicate: new Set<string>(),
  complement: new Set<string>()
})

const toSentenceOrderTokenIds = (sentence: Sentence, selectedTokenIds: Set<string>): string[] =>
  sentence.tokens
    .map((token) => token.id)
    .filter((tokenId) => selectedTokenIds.has(tokenId))

function StructureMode({
  sentence,
  onSubmit,
  lastResult,
  submitDisabled = false,
  lockedPartIds = [],
  preAnsweredPartIds = []
}: StructureModeProps) {
  const [activePartId, setActivePartId] = useState<StructurePartId>("subject")
  const [selections, setSelections] = useState<StructureSelections>(() => createEmptySelections())
  const hasComplementPart = (sentence.structure.complementTokenIds?.length ?? 0) > 0

  const disabledPartIds = useMemo(() => {
    const ids = new Set<StructurePartId>()

    for (const partId of lockedPartIds) {
      if (partId === "subject" || partId === "predicate" || partId === "complement") {
        ids.add(partId)
      }
    }
    for (const partId of preAnsweredPartIds) {
      if (partId === "subject" || partId === "predicate" || partId === "complement") {
        ids.add(partId)
      }
    }
    if (!hasComplementPart) {
      ids.add("complement")
    }

    return ids
  }, [hasComplementPart, lockedPartIds, preAnsweredPartIds])

  const activePartDisabled = submitDisabled || disabledPartIds.has(activePartId)
  const selectedTokenIds = selections[activePartId]
  const disabledTokenIds = useMemo(
    () =>
      activePartDisabled
        ? new Set(sentence.tokens.map((token) => token.id))
        : new Set<string>(),
    [activePartDisabled, sentence.tokens]
  )

  const handleTokenToggle = (tokenId: string) => {
    if (activePartDisabled) {
      return
    }

    setSelections((current) => {
      const next: StructureSelections = {
        subject: new Set(current.subject),
        predicate: new Set(current.predicate),
        complement: new Set(current.complement)
      }

      const wasSelectedInActivePart = next[activePartId].has(tokenId)
      for (const partId of STRUCTURE_PART_IDS) {
        next[partId].delete(tokenId)
      }

      if (!wasSelectedInActivePart) {
        next[activePartId].add(tokenId)
      }

      return next
    })
  }

  const handleSubmit = () => {
    onSubmit({
      subjectTokenIds: toSentenceOrderTokenIds(sentence, selections.subject),
      predicateTokenIds: toSentenceOrderTokenIds(sentence, selections.predicate),
      complementTokenIds: toSentenceOrderTokenIds(sentence, selections.complement)
    })
  }

  useEffect(() => {
    // Every new sentence round starts with empty structure selections.
    setSelections(createEmptySelections())
    setActivePartId("subject")
  }, [sentence.id])

  return (
    <section className="mode-panel" aria-label="Structure mode">
      <h2>Structure Mode</h2>

      <div className="structure-role-picker" role="group" aria-label="Structure role selection">
        {STRUCTURE_PART_IDS.map((partId) => {
          const label =
            partId === "subject"
              ? "Subject"
              : partId === "predicate"
                ? "Predicate"
                : "Complement"
          const isActive = activePartId === partId
          const isLocked = lockedPartIds.includes(partId)
          const isPreAnswered = preAnsweredPartIds.includes(partId)
          const isUnavailable = partId === "complement" && !hasComplementPart

          return (
            <button
              key={partId}
              type="button"
              className={`structure-role-button${isActive ? " is-active" : ""}`}
              onClick={() => setActivePartId(partId)}
              disabled={isUnavailable}
            >
              {label}
              {isLocked ? " (Locked)" : ""}
              {isPreAnswered ? " (Pre-answered)" : ""}
              {isUnavailable ? " (N/A)" : ""}
            </button>
          )
        })}
      </div>

      {!hasComplementPart ? (
        <p className="structure-complement-note">No complement for this sentence.</p>
      ) : null}

      <SentenceRenderer
        sentence={sentence}
        selectedTokenIds={selectedTokenIds}
        disabledTokenIds={disabledTokenIds}
        onTokenToggle={handleTokenToggle}
      />

      <div className="structure-summary" aria-label="Structure selections summary">
        <p>Active part: {activePartId}</p>
        <ul>
          <li>subject: {toSentenceOrderTokenIds(sentence, selections.subject).join(", ") || "none"}</li>
          <li>
            predicate: {toSentenceOrderTokenIds(sentence, selections.predicate).join(", ") || "none"}
          </li>
          <li>
            complement: {toSentenceOrderTokenIds(sentence, selections.complement).join(", ") || "none"}
          </li>
        </ul>
      </div>

      <button
        type="button"
        className="submit-round"
        onClick={handleSubmit}
        disabled={submitDisabled}
      >
        Validate Round
      </button>

      <ValidationFeedback result={lastResult} />
    </section>
  )
}

export default StructureMode
