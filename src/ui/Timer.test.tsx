import { render, screen } from "@testing-library/react"
import Timer from "./Timer"

describe("Timer", () => {
  test("renders elapsed seconds, target range, and running state", () => {
    render(
      <Timer
        elapsedMs={12543}
        targetMinSeconds={10}
        targetMaxSeconds={30}
        running={true}
      />
    )

    expect(screen.getByLabelText("Round timer")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Round Timer" })).toBeInTheDocument()
    expect(screen.getByText("12.5s")).toBeInTheDocument()
    expect(screen.getByText("Target: 10-30s")).toBeInTheDocument()
    expect(screen.getByText("On target pace (running)")).toBeInTheDocument()
  })

  test("shows below-target and above-target pace labels", () => {
    const view = render(
      <Timer
        elapsedMs={2500}
        targetMinSeconds={10}
        targetMaxSeconds={30}
        running={false}
      />
    )

    expect(screen.getByText("Below target pace (paused)")).toBeInTheDocument()

    view.rerender(
      <Timer
        elapsedMs={31500}
        targetMinSeconds={10}
        targetMaxSeconds={30}
        running={false}
      />
    )

    expect(screen.getByText("Above target pace (paused)")).toBeInTheDocument()
  })
})
