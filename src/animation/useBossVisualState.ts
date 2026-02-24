import { useEffect, useMemo, useRef, useState } from "react"
import type { BossDamageEvent, BossPartDestroyedEvent } from "../boss/DamageSystem"
import {
  createInitialBossVisualState,
  deriveBossVisualState,
  finalizeAllPartExplosions,
  finalizePartExplosion
} from "./effects"

type UseBossVisualStateInput = {
  roundId: number
  events: BossDamageEvent[]
  onPartDestroyed?: (event: BossPartDestroyedEvent) => void
}

type UseBossVisualStateResult = {
  crackedPartIds: ReadonlySet<string>
  explodingPartIds: ReadonlySet<string>
  removedPartIds: ReadonlySet<string>
  flashActive: boolean
  shakeActive: boolean
}

const FLASH_DURATION_MS = 180
const SHAKE_DURATION_MS = 260
const EXPLOSION_DURATION_MS = 320

const readReducedMotionPreference = (): boolean => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

// Subscribes the UI layer to engine boss events and exposes animation flags.
export const useBossVisualState = ({
  roundId,
  events,
  onPartDestroyed
}: UseBossVisualStateInput): UseBossVisualStateResult => {
  const [visualState, setVisualState] = useState(createInitialBossVisualState)
  const explosionTimerByPartIdRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const lastSoundHookRoundIdRef = useRef(-1)
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
    if (!onPartDestroyed || roundId <= lastSoundHookRoundIdRef.current) {
      return
    }

    for (const event of events) {
      if (event.type === "boss.part_destroyed") {
        onPartDestroyed(event)
      }
    }

    lastSoundHookRoundIdRef.current = roundId
  }, [events, onPartDestroyed, roundId])

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

  useEffect(() => {
    const explodingPartIds = Object.keys(visualState.explodingPartIds)
    if (explodingPartIds.length === 0) {
      return
    }

    if (prefersReducedMotion) {
      setVisualState((previousState) => finalizeAllPartExplosions(previousState))
      return
    }

    for (const partId of explodingPartIds) {
      if (explosionTimerByPartIdRef.current[partId]) {
        continue
      }

      explosionTimerByPartIdRef.current[partId] = setTimeout(() => {
        delete explosionTimerByPartIdRef.current[partId]
        setVisualState((previousState) => finalizePartExplosion(previousState, partId))
      }, EXPLOSION_DURATION_MS)
    }
  }, [prefersReducedMotion, visualState.explodingPartIds])

  useEffect(
    () => () => {
      for (const timer of Object.values(explosionTimerByPartIdRef.current)) {
        clearTimeout(timer)
      }
    },
    []
  )

  const crackedPartIds = useMemo(
    () => new Set(Object.keys(visualState.crackedPartIds)),
    [visualState.crackedPartIds]
  )
  const explodingPartIds = useMemo(
    () => new Set(Object.keys(visualState.explodingPartIds)),
    [visualState.explodingPartIds]
  )
  const removedPartIds = useMemo(
    () => new Set(Object.keys(visualState.removedPartIds)),
    [visualState.removedPartIds]
  )

  return {
    crackedPartIds,
    explodingPartIds,
    removedPartIds,
    flashActive: visualState.flashActive,
    shakeActive: visualState.shakeActive
  }
}
