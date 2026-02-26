import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { BossState, BossDamageEvent } from "../core/types";
import { createBossStateFromTemplate } from "../boss/BossModel";
import { bossTemplate } from "../core/testFixtures";
import { useBossVisualState } from "./useBossVisualState";

const Harness = ({ bossState, bossEvents }: { bossState: BossState; bossEvents: BossDamageEvent[] }) => {
  const visualState = useBossVisualState({ bossState, bossEvents });
  const horn = visualState.partStates.horn_left;

  return <div data-testid="visual-state">{`${horn?.cracked ?? false}-${horn?.flash ?? false}-${visualState.shake}`}</div>;
};

describe("useBossVisualState", () => {
  it("derives cracked/flash states from damage events", () => {
    const bossState = createBossStateFromTemplate(bossTemplate);

    render(
      <Harness
        bossState={bossState}
        bossEvents={[{ type: "boss.part_damaged", partId: "horn_left", damage: 4, remainingHP: 16 }]}
      />
    );

    expect(screen.getByTestId("visual-state")).toHaveTextContent("true-true-true");
  });
});
