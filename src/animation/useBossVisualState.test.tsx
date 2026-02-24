import { act, render, screen, waitFor } from "@testing-library/react"
import type { BossDamageEvent } from "../boss/DamageSystem"
import { useBossVisualState } from "./useBossVisualState"

type ProbeProps = {
  roundId: number
  events: BossDamageEvent[]
}

function BossVisualProbe({ roundId, events }: ProbeProps) {
  const visualState = useBossVisualState({ roundId, events })

  return (
    <div
      data-testid="boss-visual-probe"
      data-flash={visualState.flashActive ? "on" : "off"}
      data-shake={visualState.shakeActive ? "on" : "off"}
      data-cracked={Array.from(visualState.crackedPartIds).sort().join(",")}
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

    act(() => {
      view.rerender(<BossVisualProbe roundId={1} events={damageEvents} />)
    })
    expect(probe).toHaveAttribute("data-flash", "on")
    expect(probe).toHaveAttribute("data-shake", "on")
    expect(probe).toHaveAttribute("data-cracked", "horn_left")

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
    })
  })
})
