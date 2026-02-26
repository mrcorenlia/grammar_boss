import { describe, expect, it } from "vitest";
import { applyBossEventsToVisualState, clearTransientVisualState, createInitialBossVisualState } from "./effects";

describe("animation effects", () => {
  it("applies damage and destroy events idempotently", () => {
    const initial = createInitialBossVisualState(["horn_left"]);

    const once = applyBossEventsToVisualState(initial, [
      { type: "boss.part_damaged", partId: "horn_left", damage: 5, remainingHP: 15 },
      { type: "boss.part_destroyed", partId: "horn_left", overflowDamage: 0 },
    ]);

    const twice = applyBossEventsToVisualState(once, [
      { type: "boss.part_destroyed", partId: "horn_left", overflowDamage: 0 },
    ]);

    expect(once.partStates.horn_left.destroyed).toBe(true);
    expect(twice.partStates.horn_left.destroyed).toBe(true);
    expect(twice.partStates.horn_left.exploding).toBe(true);
  });

  it("clears transient effects but keeps semantic state", () => {
    const initial = createInitialBossVisualState(["core"]);
    const active = applyBossEventsToVisualState(initial, [
      { type: "boss.part_damaged", partId: "core", damage: 2, remainingHP: 48 },
    ]);

    const cleared = clearTransientVisualState(active);

    expect(cleared.shake).toBe(false);
    expect(cleared.partStates.core.flash).toBe(false);
    expect(cleared.partStates.core.cracked).toBe(true);
  });
});
