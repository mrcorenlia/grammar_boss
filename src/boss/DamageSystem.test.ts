import { describe, expect, it } from "vitest";
import { bossTemplate } from "../core/testFixtures";
import { createBossStateFromTemplate } from "./BossModel";
import { applyBossDamage } from "./DamageSystem";

describe("DamageSystem", () => {
  it("applies damage to active part first", () => {
    const boss = createBossStateFromTemplate(bossTemplate);
    const result = applyBossDamage(boss, 5);

    expect(result.bossState.parts[0].currentHP).toBe(15);
    expect(result.events[0]).toEqual({
      type: "boss.part_damaged",
      partId: "horn_left",
      damage: 5,
      remainingHP: 15,
    });
  });

  it("carries overflow to next parts and emits destroy events", () => {
    const boss = createBossStateFromTemplate(bossTemplate);
    const result = applyBossDamage(boss, 25);

    expect(result.bossState.parts[0].destroyed).toBe(true);
    expect(result.bossState.parts[1].currentHP).toBe(25);
    expect(result.events.some((event) => event.type === "boss.part_destroyed" && event.partId === "horn_left")).toBe(
      true
    );
  });

  it("emits defeated event when all parts are destroyed", () => {
    const boss = createBossStateFromTemplate(bossTemplate);
    const result = applyBossDamage(boss, 200);

    expect(result.bossState.defeated).toBe(true);
    expect(result.events.at(-1)).toEqual({ type: "boss.defeated" });
  });
});
