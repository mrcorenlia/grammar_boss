// A generic object used when validators need to return detailed metadata.
// Record<string, unknown> means:
// - keys are strings
// - values can be anything, but must be narrowed before use
export type ValidationBreakdown = Record<string, unknown>;

// Standard output format for any validation function in the engine.
// Keeping one shared result shape makes modes interchangeable.
export type ValidationResult = {
  // True when the user's full answer for the round is correct.
  correct: boolean;
  // Numeric score produced by the validation/scoring pipeline.
  score: number;
  // Human-readable reasons for mistakes (can be shown by UI).
  mistakes: string[];
  // Optional deeper data for analytics/debug/advanced feedback.
  breakdown?: ValidationBreakdown;
};

// Union type = "one of these exact strings".
// This prevents typos and keeps POS labels consistent across systems.
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

// One visible word/punctuation item in a sentence.
// Optional properties (with ?) may be absent for some tokens.
export type Token = {
  // Stable identity used by the UI and validators.
  id: string;
  // Surface form shown to the player.
  text: string;
  // Canonical dictionary form (optional).
  lemma?: string;
  // Grammatical class.
  partOfSpeech: PartOfSpeech;
  // Gender and number are optional because not all tokens have them.
  gender?: "m" | "f";
  number?: "s" | "p";
  // Optional reference to another token for future dependency features.
  headId?: string;
};

// Token id groups for sentence structure mode.
// We store ids, not indexes, so UI order can change safely.
export type SentenceStructure = {
  subjectTokenIds: string[];
  predicateTokenIds: string[];
  complementTokenIds?: string[];
};

// Nominal group metadata used by GN linking mode.
export type GNGroup = {
  nounId: string;
  determinerId?: string;
  adjectiveIds?: string[];
};

// Phrase metadata for future phrase-level activities.
export type PhraseGroup = {
  type: "prepositional";
  tokenIds: string[];
};

// Complete sentence content record loaded from JSON.
export type Sentence = {
  id: string;
  text: string;
  // Difficulty is expected to be an integer in the 1-5 range by project rules.
  difficulty: number;
  tags: string[];
  tokens: Token[];
  structure: SentenceStructure;
  groups: {
    gn: GNGroup[];
    phrases?: PhraseGroup[];
  };
};

// Template data used to initialize boss encounters from JSON content.
// This is separate from BossState because templates are static fixture data.
export type BossTemplatePart = {
  id: string;
  name: string;
  maxHP: number;
  currentHP: number;
  svgElementId: string;
};

// Boss content record loaded from fixtures in src/content/bosses.json.
export type BossTemplate = {
  id: string;
  name: string;
  baseHP: number;
  allowedTags: string[];
  parts: BossTemplatePart[];
};

// Supported player interaction modes in the MVP.
export type GameMode = "tagging" | "structure" | "gn-link" | "agreement";

// Independent HP state for a single boss body part.
export type BossPartState = {
  id: string;
  name: string;
  maxHP: number;
  currentHP: number;
  svgElementId: string;
  destroyed: boolean;
};

// Aggregate boss combat state tracked by the engine.
export type BossState = {
  id: string;
  name: string;
  maxHP: number;
  currentHP: number;
  activePartId: string | null;
  parts: BossPartState[];
  defeated: boolean;
};

// Combo progression state.
// multiplier is derived from comboCount and capped by maxMultiplier rules.
export type ComboState = {
  comboCount: number;
  multiplier: number;
  maxMultiplier: number;
};

// Score breakdown kept per round and across the whole run.
export type ScoreState = {
  totalScore: number;
  roundScore: number;
  comboBonus: number;
  speedBonus: number;
};

// Global game state contract owned by battleEngine transitions.
// Modes should read from this state but not mutate it directly.
export type BattleState = {
  currentSentence: Sentence | null;
  currentMode: GameMode;
  bossState: BossState | null;
  comboState: ComboState;
  scoreState: ScoreState;
};
