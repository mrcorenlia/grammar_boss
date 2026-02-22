import type { BossState } from "../core"

type HPBarProps = {
  bossState: BossState | null
}

// Baseline boss HP display.
// This component is view-only and reflects engine-owned boss data state.
function HPBar({ bossState }: HPBarProps) {
  if (!bossState) {
    return null
  }

  const hpPercent =
    bossState.maxHP > 0 ? Math.round((bossState.currentHP / bossState.maxHP) * 100) : 0

  return (
    <section className="hp-bar" aria-label="Boss HP">
      <div className="hp-bar__header">
        <h2>{bossState.name}</h2>
        <p>
          {bossState.currentHP} / {bossState.maxHP} HP
        </p>
      </div>
      <div
        className="hp-bar__track"
        role="progressbar"
        aria-label="Boss HP progress"
        aria-valuemin={0}
        aria-valuemax={bossState.maxHP}
        aria-valuenow={bossState.currentHP}
      >
        <div className="hp-bar__fill" style={{ width: `${hpPercent}%` }} />
      </div>
      <p className="hp-bar__active-part">
        Active part: {bossState.activePartId ?? "none"}
      </p>
    </section>
  )
}

export default HPBar
