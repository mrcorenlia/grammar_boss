export type ValidationBreakdown = Record<string, unknown>;

export type ValidationResult = {
  correct: boolean;
  score: number;
  mistakes: string[];
  breakdown?: ValidationBreakdown;
};

export type PartOfSpeech =
  | "DET"
  | "NOUN"
  | "ADJ"
  | "VERB"
  | "ADV"
  | "PRON"
  | "PREP"
  | "CONJ"
  | "INTJ"
  | "NUM"
  | "AUX"
  | "PUNCT";

export type Token = {
  id: string;
  text: string;
  lemma?: string;
  partOfSpeech: PartOfSpeech;
  gender?: "m" | "f";
  number?: "s" | "p";
  headId?: string;
};

export type SentenceStructure = {
  subjectTokenIds: string[];
  predicateTokenIds: string[];
  complementTokenIds?: string[];
};

export type GNGroup = {
  nounId: string;
  determinerId?: string;
  adjectiveIds?: string[];
};

export type PhraseGroup = {
  type: "prepositional";
  tokenIds: string[];
};

export type Sentence = {
  id: string;
  text: string;
  difficulty: number;
  tags: string[];
  tokens: Token[];
  structure: SentenceStructure;
  groups: {
    gn: GNGroup[];
    phrases?: PhraseGroup[];
  };
};

export type GameMode = "tagging" | "structure" | "gn-link" | "agreement";

export type BossPartState = {
  id: string;
  name: string;
  maxHP: number;
  currentHP: number;
  svgElementId: string;
  destroyed: boolean;
};

export type BossState = {
  id: string;
  name: string;
  maxHP: number;
  currentHP: number;
  activePartId: string | null;
  parts: BossPartState[];
  defeated: boolean;
};

export type ComboState = {
  comboCount: number;
  multiplier: number;
  maxMultiplier: number;
};

export type ScoreState = {
  totalScore: number;
  roundScore: number;
  comboBonus: number;
  speedBonus: number;
};

export type BattleState = {
  currentSentence: Sentence | null;
  currentMode: GameMode;
  bossState: BossState | null;
  comboState: ComboState;
  scoreState: ScoreState;
};
