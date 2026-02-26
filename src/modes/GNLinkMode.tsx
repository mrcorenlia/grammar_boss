import { useEffect, useMemo, useState } from "react"
import type { GNLinkModeUserInput, Sentence, ValidationResult } from "../core"
import SentenceRenderer from "../ui/SentenceRenderer"
import ValidationFeedback from "../ui/ValidationFeedback"

type GNLinkModeProps = {
  sentence: Sentence
  onSubmit: (payload: GNLinkModeUserInput) => void
  lastResult: ValidationResult | null
  secretAutofillVersion?: number
  submitDisabled?: boolean
  lockedLinkIds?: string[]
  preAnsweredLinkIds?: string[]
}

type LinkKind = "determiner" | "adjective"

type LinkableDependent = {
  dependentId: string
  dependentText: string
  kind: LinkKind
}

type NounOption = {
  nounId: string
  nounText: string
}
const EMPTY_INTERACTION_IDS: string[] = []

const listLinkableDependents = (sentence: Sentence): LinkableDependent[] => {
  const kindByDependentId = new Map<string, LinkKind>()
  for (const group of sentence.groups.gn) {
    if (group.determinerId) {
      kindByDependentId.set(group.determinerId, "determiner")
    }

    for (const adjectiveId of group.adjectiveIds ?? []) {
      kindByDependentId.set(adjectiveId, "adjective")
    }
  }

  return sentence.tokens
    .flatMap((token) => {
      const kind = kindByDependentId.get(token.id)
      if (!kind) {
        return []
      }

      return [
        {
          dependentId: token.id,
          dependentText: token.text,
          kind
        }
      ]
    })
}

const listNounOptions = (sentence: Sentence): NounOption[] => {
  const nounIdSet = new Set(sentence.groups.gn.map((group) => group.nounId))
  return sentence.tokens
    .filter((token) => nounIdSet.has(token.id))
    .map((token) => ({
      nounId: token.id,
      nounText: token.text
    }))
}

function GNLinkMode({
  sentence,
  onSubmit,
  lastResult,
  secretAutofillVersion = 0,
  submitDisabled = false,
  lockedLinkIds = EMPTY_INTERACTION_IDS,
  preAnsweredLinkIds = EMPTY_INTERACTION_IDS
}: GNLinkModeProps) {
  const [activeDependentId, setActiveDependentId] = useState<string | null>(null)
  const [dependentIdToNounId, setDependentIdToNounId] = useState<Record<string, string>>({})

  const linkableDependents = useMemo(() => listLinkableDependents(sentence), [sentence])
  const nounOptions = useMemo(() => listNounOptions(sentence), [sentence])
  const linkableDependentIdSet = useMemo(
    () => new Set(linkableDependents.map((item) => item.dependentId)),
    [linkableDependents]
  )
  const nounOptionIdSet = useMemo(
    () => new Set(nounOptions.map((option) => option.nounId)),
    [nounOptions]
  )

  const disabledDependentIds = useMemo(
    () => new Set([...lockedLinkIds, ...preAnsweredLinkIds]),
    [lockedLinkIds, preAnsweredLinkIds]
  )

  const disabledTokenIds = useMemo(() => {
    const disabled = new Set<string>()
    for (const token of sentence.tokens) {
      if (!linkableDependentIdSet.has(token.id) || disabledDependentIds.has(token.id) || submitDisabled) {
        disabled.add(token.id)
      }
    }
    return disabled
  }, [disabledDependentIds, linkableDependentIdSet, sentence.tokens, submitDisabled])

  const selectedTokenIds = useMemo(() => {
    const selected = new Set<string>()

    for (const dependentId of Object.keys(dependentIdToNounId)) {
      if (linkableDependentIdSet.has(dependentId) && !disabledDependentIds.has(dependentId)) {
        selected.add(dependentId)
      }
    }

    if (
      activeDependentId &&
      linkableDependentIdSet.has(activeDependentId) &&
      !disabledDependentIds.has(activeDependentId)
    ) {
      selected.add(activeDependentId)
    }

    return selected
  }, [activeDependentId, dependentIdToNounId, disabledDependentIds, linkableDependentIdSet])

  const activeDependent = useMemo(
    () =>
      linkableDependents.find((item) => item.dependentId === activeDependentId) ?? null,
    [activeDependentId, linkableDependents]
  )

  const activeDependentIsDisabled =
    !activeDependent ||
    submitDisabled ||
    disabledDependentIds.has(activeDependent.dependentId)

  const handleTokenToggle = (tokenId: string) => {
    if (
      submitDisabled ||
      disabledDependentIds.has(tokenId) ||
      !linkableDependentIdSet.has(tokenId)
    ) {
      return
    }

    setActiveDependentId((current) => (current === tokenId ? null : tokenId))
  }

  const handleAssignNoun = (nounId: string) => {
    if (activeDependentIsDisabled) {
      return
    }

    setDependentIdToNounId((current) => ({
      ...current,
      [activeDependent.dependentId]: nounId
    }))
  }

  const handleClearActiveLink = () => {
    if (activeDependentIsDisabled) {
      return
    }

    setDependentIdToNounId((current) => {
      const next = { ...current }
      delete next[activeDependent.dependentId]
      return next
    })
  }

  const handleSubmit = () => {
    const filteredDependentIdToNounId = Object.fromEntries(
      Object.entries(dependentIdToNounId).filter(
        ([dependentId, nounId]) =>
          linkableDependentIdSet.has(dependentId) &&
          !disabledDependentIds.has(dependentId) &&
          nounOptionIdSet.has(nounId)
      )
    )

    onSubmit({ dependentIdToNounId: filteredDependentIdToNounId })
  }

  useEffect(() => {
    if (secretAutofillVersion <= 0) {
      return
    }

    // Easter egg helper: prefill GN links from sentence group answers.
    const nextDependentIdToNounId: Record<string, string> = {}

    for (const group of sentence.groups.gn) {
      if (group.determinerId && !disabledDependentIds.has(group.determinerId)) {
        nextDependentIdToNounId[group.determinerId] = group.nounId
      }

      for (const adjectiveId of group.adjectiveIds ?? []) {
        if (!disabledDependentIds.has(adjectiveId)) {
          nextDependentIdToNounId[adjectiveId] = group.nounId
        }
      }
    }

    setDependentIdToNounId(nextDependentIdToNounId)
    setActiveDependentId(null)
  }, [disabledDependentIds, secretAutofillVersion, sentence])

  useEffect(() => {
    setActiveDependentId(null)
    setDependentIdToNounId({})
  }, [sentence.id])

  return (
    <section className="mode-panel" aria-label="GN link mode">
      <h2>GN Link Mode</h2>
      <SentenceRenderer
        sentence={sentence}
        selectedTokenIds={selectedTokenIds}
        disabledTokenIds={disabledTokenIds}
        onTokenToggle={handleTokenToggle}
      />

      <div className="gn-link-controls">
        <p>
          Active dependent: {activeDependent ? `${activeDependent.dependentText} (${activeDependent.kind})` : "none"}
        </p>
        <div className="gn-link-nouns" role="group" aria-label="GN noun targets">
          {nounOptions.map((option) => (
            <button
              key={option.nounId}
              type="button"
              className="pos-option"
              onClick={() => handleAssignNoun(option.nounId)}
              disabled={activeDependentIsDisabled}
            >
              {option.nounText}
            </button>
          ))}
          <button
            type="button"
            className="pos-option"
            onClick={handleClearActiveLink}
            disabled={activeDependentIsDisabled}
          >
            Clear Link
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

      <div className="tagging-summary" aria-label="GN link summary">
        <h3>Current Links</h3>
        <ul>
          {linkableDependents.map((dependent) => {
            const linkedNounId = dependentIdToNounId[dependent.dependentId]
            const linkedNoun = nounOptions.find((option) => option.nounId === linkedNounId)

            return (
              <li key={dependent.dependentId}>
                {dependent.dependentId} ({dependent.kind}): {linkedNoun ? `${linkedNoun.nounText} (${linkedNoun.nounId})` : "unlinked"}
                {lockedLinkIds.includes(dependent.dependentId) ? " [locked]" : ""}
                {preAnsweredLinkIds.includes(dependent.dependentId) ? " [pre-answered]" : ""}
              </li>
            )
          })}
        </ul>
      </div>

      <ValidationFeedback result={lastResult} />
    </section>
  )
}

export default GNLinkMode
