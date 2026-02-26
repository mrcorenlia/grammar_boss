import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { bossTemplate } from "../core/testFixtures";
import { createBossStateFromTemplate } from "./BossModel";
import { BossRenderer } from "./BossRenderer";
import { createInitialBossVisualState } from "../animation/effects";

describe("BossRenderer", () => {
  it("renders stable part ids", () => {
    const bossState = createBossStateFromTemplate(bossTemplate);
    const visualState = createInitialBossVisualState(bossState.parts.map((part) => part.id));

    render(<BossRenderer bossState={bossState} visualState={visualState} />);

    expect(screen.getByTestId("boss-part-horn_left")).toHaveAttribute("id", "horn_left");
    expect(screen.getByTestId("boss-part-arm_left")).toBeInTheDocument();
  });

  it("removes destroyed parts from svg", () => {
    const bossState = createBossStateFromTemplate(bossTemplate);
    bossState.parts[0].destroyed = true;
    const visualState = createInitialBossVisualState(bossState.parts.map((part) => part.id));

    render(<BossRenderer bossState={bossState} visualState={visualState} />);

    expect(screen.queryByTestId("boss-part-horn_left")).not.toBeInTheDocument();
  });
});
