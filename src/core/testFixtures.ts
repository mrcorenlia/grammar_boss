import type { BossTemplate, Sentence } from "./types";

/**
 * Shared fixtures keep tests concise and use valid schema-aligned content.
 */
export const sentenceOne: Sentence = {
  id: "s1",
  text: "La petite maison rouge est belle.",
  difficulty: 2,
  tags: ["agreement", "gn", "structure"],
  tokens: [
    { id: "t1", text: "La", partOfSpeech: "DET", gender: "f", number: "s" },
    { id: "t2", text: "petite", partOfSpeech: "ADJ", gender: "f", number: "s" },
    { id: "t3", text: "maison", partOfSpeech: "NOUN", gender: "f", number: "s" },
    { id: "t4", text: "rouge", partOfSpeech: "ADJ", gender: "f", number: "s" },
    { id: "t5", text: "est", partOfSpeech: "VERB" },
    { id: "t6", text: "belle", partOfSpeech: "ADJ", gender: "f", number: "s" },
    { id: "t7", text: ".", partOfSpeech: "PUNCT" },
  ],
  structure: {
    subjectTokenIds: ["t1", "t2", "t3", "t4"],
    predicateTokenIds: ["t5", "t6"],
    complementTokenIds: [],
  },
  groups: {
    gn: [
      {
        nounId: "t3",
        determinerId: "t1",
        adjectiveIds: ["t2", "t4"],
      },
    ],
  },
};

export const sentenceTwo: Sentence = {
  id: "s2",
  text: "Les chiens courent dans le parc.",
  difficulty: 2,
  tags: ["agreement", "preposition", "structure"],
  tokens: [
    { id: "u1", text: "Les", partOfSpeech: "DET", gender: "m", number: "p" },
    { id: "u2", text: "chiens", partOfSpeech: "NOUN", gender: "m", number: "p" },
    { id: "u3", text: "courent", partOfSpeech: "VERB" },
    { id: "u4", text: "dans", partOfSpeech: "ADP" },
    { id: "u5", text: "le", partOfSpeech: "DET", gender: "m", number: "s" },
    { id: "u6", text: "parc", partOfSpeech: "NOUN", gender: "m", number: "s" },
    { id: "u7", text: ".", partOfSpeech: "PUNCT" },
  ],
  structure: {
    subjectTokenIds: ["u1", "u2"],
    predicateTokenIds: ["u3"],
    complementTokenIds: ["u4", "u5", "u6"],
  },
  groups: {
    gn: [
      { nounId: "u2", determinerId: "u1" },
      { nounId: "u6", determinerId: "u5" },
    ],
    phrases: [
      {
        type: "prepositional",
        tokenIds: ["u4", "u5", "u6"],
      },
    ],
  },
};

export const bossTemplate: BossTemplate = {
  id: "b1",
  name: "Accord Dragon",
  baseHP: 100,
  allowedTags: ["agreement", "gn", "structure"],
  parts: [
    {
      id: "horn_left",
      name: "Left Horn",
      maxHP: 20,
      currentHP: 20,
      svgElementId: "horn_left",
    },
    {
      id: "arm_left",
      name: "Left Arm",
      maxHP: 30,
      currentHP: 30,
      svgElementId: "arm_left",
    },
    {
      id: "core",
      name: "Core",
      maxHP: 50,
      currentHP: 50,
      svgElementId: "core",
    },
  ],
};

export const allSentences: Sentence[] = [sentenceOne, sentenceTwo];
