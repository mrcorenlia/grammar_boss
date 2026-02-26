import { describe, expect, it } from "vitest";
import { formatFeedbackMessage } from "./feedback";

describe("feedback", () => {
  it("formats known feedback codes", () => {
    expect(
      formatFeedbackMessage({
        code: "tag.mismatch",
        level: "error",
        params: { expected: "DET", received: "NOUN" },
        tokenId: "t1",
      })
    ).toContain("DET");
  });

  it("falls back to code when unknown", () => {
    expect(formatFeedbackMessage({ code: "unknown", level: "info" })).toBe("unknown");
  });
});
