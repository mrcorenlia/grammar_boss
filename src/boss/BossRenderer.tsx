import type { BossState } from "../core"

type BossRendererProps = {
  bossState: BossState | null
  crackedPartIds: ReadonlySet<string>
  explodingPartIds: ReadonlySet<string>
  removedPartIds: ReadonlySet<string>
  flashActive: boolean
  shakeActive: boolean
}

const buildClassName = (parts: Array<string | false>): string =>
  parts.filter((value): value is string => Boolean(value)).join(" ")

// SVG shell for boss visuals.
// Animation classes are driven by engine event subscriptions in the UI layer.
function BossRenderer({
  bossState,
  crackedPartIds,
  explodingPartIds,
  removedPartIds,
  flashActive,
  shakeActive
}: BossRendererProps) {
  if (!bossState) {
    return null
  }

  return (
    <section
      className={buildClassName([
        "boss-renderer",
        flashActive && "is-flashing",
        shakeActive && "is-shaking"
      ])}
      aria-label="Boss renderer"
    >
      <svg viewBox="0 0 560 120" role="img" aria-label={`${bossState.name} visual`}>
        {bossState.parts.map((part, index) => {
          if (removedPartIds.has(part.id)) {
            return null
          }

            const x = 16 + index * 108
            const y = 28
            const isActive = bossState.activePartId === part.id
            const isCracked = crackedPartIds.has(part.id)
            const isExploding = explodingPartIds.has(part.id)

            return (
              <g
                key={part.id}
                id={part.svgElementId}
                data-part-id={part.id}
                className={buildClassName([
                  "boss-part",
                  isActive && "is-active",
                  isCracked && "is-cracked",
                  isExploding && "is-exploding",
                  part.destroyed && "is-destroyed"
                ])}
              >
                <rect x={x} y={y} width="96" height="64" rx="12" ry="12" />
                <text x={x + 48} y={y + 38} textAnchor="middle">
                  {part.id}
                </text>
              </g>
            )
          })}
      </svg>
    </section>
  )
}

export default BossRenderer
