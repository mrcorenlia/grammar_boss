import { describe, expect, it } from "vitest";
import { sentenceOne, sentenceTwo } from "../core/testFixtures";
import { getAgreementNouns, getGNDependents, getGNNouns } from "./modeContentSource";

describe("modeContentSource", () => {
  it("derives GN dependents from sentence groups", () => {
    expect(getGNDependents(sentenceOne)).toEqual(["t1", "t2", "t4"]);
    expect(getGNNouns(sentenceOne)).toEqual(["t3"]);
  });

  it("derives agreement nouns with inflection metadata", () => {
    expect(getAgreementNouns(sentenceTwo).map((noun) => noun.id)).toEqual(["u2", "u6"]);
  });
});
