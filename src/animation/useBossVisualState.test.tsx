import { act, render, screen, waitFor } from "@testing-library/react"
import type { BossDamageEvent, BossPartDestroyedEvent } from "../boss/DamageSystem"
import { useBossVisualState } from "./useBossVisualState"

type ProbeProps = {
  roundId: number
  events: BossDamageEvent[]
  onPartDestroyed?: (event: BossPartDestroyedEvent) => void
}

function BossVisualProbe({ roundId, events, onPartDestroyed }: ProbeProps) {
  const visualState = useBossVisualState(
    onPartDestroyed
      ? { roundId, events, onPartDestroyed }
      : { roundId, events }
  )

  return (
    <div
      data-testid="boss-visual-probe"
      data-flash={visualState.flashActive ? "on" : "off"}
      data-shake={visualState.shakeActive ? "on" : "off"}
      data-cracked={Array.from(visualState.crackedPartIds).sort().join(",")}
      data-exploding={Array.from(visualState.explodingPartIds).sort().join(",")}
      data-removed={Array.from(visualState.removedPartIds).sort().join(",")}
    />
  )
}

const makeMatchMedia = (matches: boolean) =>
  vi.fn().mockImplementation(() => ({
    matches,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))

describe("useBossVisualState", () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  test("activates flash/shake on part damage, then clears timers while cracks persist", async () => {
    vi.useFakeTimers()
    vi.stubGlobal("matchMedia", makeMatchMedia(false))

    const damageEvents: BossDamageEvent[] = [
      {
        type: "boss.part_damaged",
        bossId: "b1",
        partId: "horn_left",
        svgElementId: "horn_left",
        damage: 10,
        remainingHP: 20
      }
    ]

    const view = render(<BossVisualProbe roundId={0} events={[]} />)
    const probe = screen.getByTestId("boss-visual-probe")
    expect(probe).toHaveAttribute("data-flash", "off")
    expect(probe).toHaveAttribute("data-shake", "off")
    expect(probe).toHaveAttribute("data-cracked", "")
    expect(probe).toHaveAttribute("data-exploding", "")
    expect(probe).toHaveAttribute("data-removed", "")

    act(() => {
      view.rerender(<BossVisualProbe roundId={1} events={damageEvents} />)
    })
    expect(probe).toHaveAttribute("data-flash", "on")
    expect(probe).toHaveAttribute("data-shake", "on")
    expect(probe).toHaveAttribute("data-cracked", "horn_left")
    expect(probe).toHaveAttribute("data-exploding", "")
    expect(probe).toHaveAttribute("data-removed", "")

    act(() => {
      vi.advanceTimersByTime(180)
    })
    expect(probe).toHaveAttribute("data-flash", "off")
    expect(probe).toHaveAttribute("data-shake", "on")

    act(() => {
      vi.advanceTimersByTime(80)
    })
    expect(probe).toHaveAttribute("data-shake", "off")

    // Re-processing the same round must not re-trigger transient flags.
    view.rerender(<BossVisualProbe roundId={1} events={damageEvents} />)
    expect(probe).toHaveAttribute("data-flash", "off")
    expect(probe).toHaveAttribute("data-shake", "off")
    expect(probe).toHaveAttribute("data-cracked", "horn_left")
  })

  test("processes part destruction with one-shot sound hooks and timed removal", () => {
    vi.useFakeTimers()
    vi.stubGlobal("matchMedia", makeMatchMedia(false))
    const onPartDestroyed = vi.fn()
    const roundEvents: BossDamageEvent[] = [
      {
        type: "boss.part_damaged",
        bossId: "b1",
        partId: "horn_right",
        svgElementId: "horn_right",
        damage: 30,
        remainingHP: 0
      },
      {
        type: "boss.part_destroyed",
        bossId: "b1",
        partId: "horn_right",
        svgElementId: "horn_right"
      }
    ]

    const view = render(
      <BossVisualProbe roundId={2} events={roundEvents} onPartDestroyed={onPartDestroyed} />
    )
    const probe = screen.getByTestId("boss-visual-probe")
    expect(probe).toHaveAttribute("data-exploding", "horn_right")
    expect(probe).toHaveAttribute("data-removed", "")
    expect(onPartDestroyed).toHaveBeenCalledTimes(1)

    // Re-processing identical round id must not trigger duplicate sound hooks.
    view.rerender(
      <BossVisualProbe roundId={2} events={roundEvents} onPartDestroyed={onPartDestroyed} />
    )
    expect(onPartDestroyed).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(320)
    })
    expect(probe).toHaveAttribute("data-exploding", "")
    expect(probe).toHaveAttribute("data-removed", "horn_right")
  })

  test("respects reduced-motion by skipping flash/shake while retaining cracks", async () => {
    vi.stubGlobal("matchMedia", makeMatchMedia(true))

    const damageEvents: BossDamageEvent[] = [
      {
        type: "boss.part_damaged",
        bossId: "b1",
        partId: "core",
        svgElementId: "core",
        damage: 6,
        remainingHP: 34
      }
    ]

    render(<BossVisualProbe roundId={2} events={damageEvents} />)
    const probe = screen.getByTestId("boss-visual-probe")

    await waitFor(() => {
      expect(probe).toHaveAttribute("data-flash", "off")
      expect(probe).toHaveAttribute("data-shake", "off")
      expect(probe).toHaveAttribute("data-cracked", "core")
      expect(probe).toHaveAttribute("data-exploding", "")
      expect(probe).toHaveAttribute("data-removed", "")
    })
  })

  test("finalizes destruction instantly for reduced-motion users", async () => {
    vi.stubGlobal("matchMedia", makeMatchMedia(true))

    const events: BossDamageEvent[] = [
      {
        type: "boss.part_destroyed",
        bossId: "b1",
        partId: "core",
        svgElementId: "core"
      }
    ]

    render(<BossVisualProbe roundId={4} events={events} />)
    const probe = screen.getByTestId("boss-visual-probe")

    await waitFor(() => {
      expect(probe).toHaveAttribute("data-exploding", "")
      expect(probe).toHaveAttribute("data-removed", "core")
    })
  })
})
