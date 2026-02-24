import { useEffect, useMemo, useState } from "react"
import type { BossDamageEvent } from "../boss/DamageSystem"
import {
  createInitialBossVisualState,
  deriveBossVisualState
} from "./effects"

type UseBossVisualStateInput = {
  roundId: number
  events: BossDamageEvent[]
}

type UseBossVisualStateResult = {
  crackedPartIds: ReadonlySet<string>
  flashActive: boolean
  shakeActive: boolean
}

const FLASH_DURATION_MS = 180
const SHAKE_DURATION_MS = 260

const readReducedMotionPreference = (): boolean => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

// Subscribes the UI layer to engine boss events and exposes animation flags.
export const useBossVisualState = ({
  roundId,
  events
}: UseBossVisualStateInput): UseBossVisualStateResult => {
  const [visualState, setVisualState] = useState(createInitialBossVisualState)
  const prefersReducedMotion = useMemo(readReducedMotionPreference, [])

  useEffect(() => {
    setVisualState((previousState) =>
      deriveBossVisualState(previousState, {
        roundId,
        events
      })
    )
  }, [events, roundId])

  useEffect(() => {
    if (visualState.lastProcessedRoundId < 0) {
      return
    }

    const flashActiveForRound = visualState.flashActive
    const shakeActiveForRound = visualState.shakeActive
    if (!flashActiveForRound && !shakeActiveForRound) {
      return
    }

    if (prefersReducedMotion) {
      setVisualState((previousState) => ({
        ...previousState,
        flashActive: false,
        shakeActive: false
      }))
      return
    }

    let flashTimer: ReturnType<typeof setTimeout> | null = null
    let shakeTimer: ReturnType<typeof setTimeout> | null = null

    if (flashActiveForRound) {
      flashTimer = setTimeout(() => {
        setVisualState((previousState) => ({
          ...previousState,
          flashActive: false
        }))
      }, FLASH_DURATION_MS)
    }

    if (shakeActiveForRound) {
      shakeTimer = setTimeout(() => {
        setVisualState((previousState) => ({
          ...previousState,
          shakeActive: false
        }))
      }, SHAKE_DURATION_MS)
    }

    return () => {
      if (flashTimer !== null) {
        clearTimeout(flashTimer)
      }
      if (shakeTimer !== null) {
        clearTimeout(shakeTimer)
      }
    }
  }, [prefersReducedMotion, visualState.lastProcessedRoundId])

  const crackedPartIds = useMemo(
    () => new Set(Object.keys(visualState.crackedPartIds)),
    [visualState.crackedPartIds]
  )

  return {
    crackedPartIds,
    flashActive: visualState.flashActive,
    shakeActive: visualState.shakeActive
  }
}
