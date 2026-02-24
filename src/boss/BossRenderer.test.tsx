import { render, screen } from "@testing-library/react"
import { loadBossesFromContent } from "../core"
import { createBossStateFromTemplate } from "./BossModel"
import BossRenderer from "./BossRenderer"

describe("BossRenderer", () => {
  test("renders nothing when no boss state exists", () => {
    const { container } = render(
      <BossRenderer
        bossState={null}
        crackedPartIds={new Set<string>()}
        flashActive={false}
        shakeActive={false}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  test("renders stable svg part ids and animation classes", () => {
    const template = loadBossesFromContent()[0]
    expect(template).toBeDefined()
    if (!template) {
      throw new Error("Boss fixture must include at least one boss.")
    }

    const state = createBossStateFromTemplate(template)
    const firstPart = state.parts[0]
    const secondPart = state.parts[1]
    if (!firstPart || !secondPart) {
      throw new Error("Boss fixture must include at least two parts.")
    }

    // Create a deterministic state snapshot with one cracked and one destroyed part.
    const renderedState = {
      ...state,
      activePartId: secondPart.id,
      parts: state.parts.map((part) => {
        if (part.id === firstPart.id) {
          return {
            ...part,
            currentHP: 0,
            destroyed: true
          }
        }

        return { ...part }
      })
    }

    const { container } = render(
      <BossRenderer
        bossState={renderedState}
        crackedPartIds={new Set([firstPart.id, secondPart.id])}
        flashActive={true}
        shakeActive={true}
      />
    )

    const renderer = screen.getByLabelText("Boss renderer")
    expect(renderer).toHaveClass("boss-renderer")
    expect(renderer).toHaveClass("is-flashing")
    expect(renderer).toHaveClass("is-shaking")

    for (const part of renderedState.parts) {
      const partNode = container.querySelector(`g#${part.svgElementId}`)
      expect(partNode).not.toBeNull()
      expect(partNode).toHaveClass("boss-part")
    }

    const destroyedNode = container.querySelector(`g#${firstPart.svgElementId}`)
    const activeNode = container.querySelector(`g#${secondPart.svgElementId}`)
    expect(destroyedNode).toHaveClass("is-cracked")
    expect(destroyedNode).toHaveClass("is-destroyed")
    expect(activeNode).toHaveClass("is-active")
    expect(activeNode).toHaveClass("is-cracked")
  })
})
