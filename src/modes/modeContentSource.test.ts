import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bossesFixture from "../content/bosses.json";
import sentencesFixture from "../content/sentences.json";
import { getModeBosses, getModeSentences } from "./modeContentSource";

const currentFilePath = fileURLToPath(import.meta.url);
const modesDir = path.dirname(currentFilePath);

const listModeSourceFiles = (directory: string): string[] => {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listModeSourceFiles(fullPath));
      continue;
    }

    const isModeSource = entry.name.endsWith(".ts") || entry.name.endsWith(".tsx");
    const isTestSource =
      entry.name.endsWith(".test.ts") || entry.name.endsWith(".test.tsx");
    if (isModeSource && !isTestSource) {
      files.push(fullPath);
    }
  }

  return files;
};

const hasInlineSentenceFixtureShape = (source: string): boolean => {
  const sentenceFixtureSignals = [
    /\bdifficulty\s*:\s*\d/,
    /\btokens\s*:\s*\[/,
    /\bstructure\s*:\s*\{/,
    /\bgroups\s*:\s*\{/,
    /\bsubjectTokenIds\s*:\s*\[/,
    /\bpredicateTokenIds\s*:\s*\[/
  ];

  const signalMatches = sentenceFixtureSignals.filter((pattern) => pattern.test(source)).length;
  return signalMatches >= 3;
};

const hasInlineBossFixtureShape = (source: string): boolean => {
  const bossFixtureSignals = [
    /\bbaseHP\s*:\s*\d/,
    /\ballowedTags\s*:\s*\[/,
    /\bparts\s*:\s*\[/,
    /\bsvgElementId\s*:\s*["']/
  ];

  const signalMatches = bossFixtureSignals.filter((pattern) => pattern.test(source)).length;
  return signalMatches >= 3;
};

describe("modeContentSource", () => {
  test("loads sentence answers from content fixtures", () => {
    const sentences = getModeSentences();
    expect(sentences).toEqual(sentencesFixture);
  });

  test("loads boss templates from content fixtures", () => {
    const bosses = getModeBosses();
    expect(bosses).toEqual(bossesFixture);
  });

  test("mode source files do not embed inline sentence or boss fixtures", () => {
    const modeFiles = listModeSourceFiles(modesDir);

    for (const fileName of modeFiles) {
      const source = readFileSync(fileName, "utf8");
      expect(hasInlineSentenceFixtureShape(source)).toBe(false);
      expect(hasInlineBossFixtureShape(source)).toBe(false);
    }
  });

  test("mode source files do not import content JSON directly", () => {
    const modeFiles = listModeSourceFiles(modesDir);
    const disallowedImportPatterns = [
      /from\s+["'](?:\.\.\/)+content\/.*\.json["']/,
      /from\s+["']@\/content\/.*\.json["']/,
      /import\(\s*["'](?:\.\.\/)+content\/.*\.json["']\s*\)/,
      /import\(\s*["']@\/content\/.*\.json["']\s*\)/
    ];

    for (const fileName of modeFiles) {
      const source = readFileSync(fileName, "utf8");
      for (const pattern of disallowedImportPatterns) {
        expect(source).not.toMatch(pattern);
      }
    }
  });
});
