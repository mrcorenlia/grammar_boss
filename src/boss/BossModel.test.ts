import { describe, expect, it } from "vitest";
import { bossTemplate } from "../core/testFixtures";
import { createBossStateFromTemplate } from "./BossModel";

describe("BossModel", () => {
  it("creates independent boss state from template", () => {
    const bossState = createBossStateFromTemplate(bossTemplate);

    expect(bossState.totalHP).toBe(100);
    expect(bossState.maxHP).toBe(100);
    expect(bossState.parts).toHaveLength(3);
    expect(bossState.parts[0].svgElementId).toBe("horn_left");
  });

  it("does not mutate template object", () => {
    const cloned = structuredClone(bossTemplate);
    createBossStateFromTemplate(bossTemplate);
    expect(bossTemplate).toEqual(cloned);
  });
});
