import { render, screen } from "@testing-library/react"
import { loadBossesFromContent } from "../core"
import { createBossStateFromTemplate } from "../boss/BossModel"
import HPBar from "./HPBar"

describe("HPBar", () => {
  test("renders boss HP values from boss state", () => {
    const template = loadBossesFromContent()[0]
    expect(template).toBeDefined()
    if (!template) {
      throw new Error("Boss fixture must include at least one boss.")
    }

    const state = createBossStateFromTemplate(template)
    render(<HPBar bossState={state} />)

    expect(screen.getByText(template.name)).toBeInTheDocument()
    expect(
      screen.getByText(`${state.currentHP} / ${state.maxHP} HP`)
    ).toBeInTheDocument()

    const progress = screen.getByRole("progressbar", { name: "Boss HP progress" })
    expect(progress).toHaveAttribute("aria-valuenow", `${state.currentHP}`)
    expect(progress).toHaveAttribute("aria-valuemax", `${state.maxHP}`)
  })

  test("renders nothing when no boss state exists", () => {
    const { container } = render(<HPBar bossState={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
