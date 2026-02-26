type TimerProps = {
  elapsedMs: number
  targetMinSeconds?: number
  targetMaxSeconds?: number
  running?: boolean
}

const DEFAULT_TARGET_MIN_SECONDS = 10
const DEFAULT_TARGET_MAX_SECONDS = 30

const toNonNegativeMs = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0

const formatElapsedSeconds = (elapsedMs: number): string => (elapsedMs / 1000).toFixed(1)

const getPaceLabel = (
  elapsedMs: number,
  targetMinSeconds: number,
  targetMaxSeconds: number
): string => {
  const elapsedSeconds = elapsedMs / 1000
  if (elapsedSeconds < targetMinSeconds) {
    return "Below target pace"
  }
  if (elapsedSeconds <= targetMaxSeconds) {
    return "On target pace"
  }

  return "Above target pace"
}

// Round timer display for pacing feedback.
// This component is display-only so App owns timing state/tick logic.
function Timer({
  elapsedMs,
  targetMinSeconds = DEFAULT_TARGET_MIN_SECONDS,
  targetMaxSeconds = DEFAULT_TARGET_MAX_SECONDS,
  running = true
}: TimerProps) {
  const normalizedElapsedMs = toNonNegativeMs(elapsedMs)
  const safeTargetMin = Math.max(0, Math.trunc(targetMinSeconds))
  const safeTargetMax = Math.max(safeTargetMin, Math.trunc(targetMaxSeconds))
  const paceLabel = getPaceLabel(normalizedElapsedMs, safeTargetMin, safeTargetMax)

  return (
    <section className="round-timer" aria-label="Round timer">
      <h2>Round Timer</h2>
      <p className="round-timer__value">{formatElapsedSeconds(normalizedElapsedMs)}s</p>
      <p className="round-timer__target">
        Target: {safeTargetMin}-{safeTargetMax}s
      </p>
      <p className="round-timer__status">
        {paceLabel} ({running ? "running" : "paused"})
      </p>
    </section>
  )
}

export default Timer
