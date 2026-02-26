import { describe, expect, it } from "vitest";
import { initialComboState, updateComboState } from "./combo";

describe("combo", () => {
  it("starts at 0 streak and 1x multiplier", () => {
    expect(initialComboState).toEqual({ streak: 0, multiplier: 1 });
  });

  it("increments streak and scales multiplier up to 3x", () => {
    const c1 = updateComboState(initialComboState, true);
    const c2 = updateComboState(c1, true);
    const c3 = updateComboState(c2, true);
    const c4 = updateComboState(c3, true);

    expect(c1).toEqual({ streak: 1, multiplier: 1 });
    expect(c2).toEqual({ streak: 2, multiplier: 2 });
    expect(c3).toEqual({ streak: 3, multiplier: 2 });
    expect(c4).toEqual({ streak: 4, multiplier: 3 });
  });

  it("resets combo on incorrect rounds", () => {
    const withStreak = updateComboState(updateComboState(initialComboState, true), true);

    expect(updateComboState(withStreak, false)).toEqual({ streak: 0, multiplier: 1 });
  });
});
