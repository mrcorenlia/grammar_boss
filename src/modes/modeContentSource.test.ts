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

describe("modeContentSource", () => {
  test("loads sentence answers from content fixtures", () => {
    const sentences = getModeSentences();
    expect(sentences).toEqual(sentencesFixture);
  });

  test("loads boss templates from content fixtures", () => {
    const bosses = getModeBosses();
    expect(bosses).toEqual(bossesFixture);
  });

  test("mode source files do not embed inline answer key literals", () => {
    const modeFiles = listModeSourceFiles(modesDir);
    const inlineAnswerPatterns = [
      /subjectTokenIds\s*:\s*\[/,
      /predicateTokenIds\s*:\s*\[/,
      /nounId\s*:\s*["']/,
      /determinerId\s*:\s*["']/,
      /adjectiveIds\s*:\s*\[/,
      /partOfSpeech\s*:\s*["']/,
      /gender\s*:\s*["'][mf]["']/,
      /number\s*:\s*["'][sp]["']/
    ];

    for (const fileName of modeFiles) {
      const source = readFileSync(fileName, "utf8");
      for (const pattern of inlineAnswerPatterns) {
        expect(source).not.toMatch(pattern);
      }
    }
  });

  test("mode source files do not import content JSON directly", () => {
    const modeFiles = listModeSourceFiles(modesDir);
    for (const fileName of modeFiles) {
      const source = readFileSync(fileName, "utf8");
      expect(source).not.toMatch(/from\s+["'](\.\.\/)+content\/.*\.json["']/);
    }
  });
});
