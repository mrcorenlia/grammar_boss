/**
 * Core types stay framework-agnostic so the engine can be reused without React.
 */

export type GameMode = "tagging" | "structure" | "gn-link" | "agreement";

export type PartOfSpeech =
  | "DET"
  | "NOUN"
  | "ADJ"
  | "VERB"
  | "ADV"
  | "PRON"
  | "ADP"
  | "CONJ"
  | "INTJ"
  | "NUM"
  | "PART"
  | "PUNCT";

export type Gender = "m" | "f";
export type GrammaticalNumber = "s" | "p";

export type Token = {
  id: string;
  text: string;
  lemma?: string;
  partOfSpeech: PartOfSpeech;
  gender?: Gender;
  number?: GrammaticalNumber;
  headId?: string;
};

export type StructureAnswer = {
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
  structure: StructureAnswer;
  groups: {
    gn: GNGroup[];
    phrases?: PhraseGroup[];
  };
};

export type BossPart = {
  id: string;
  name: string;
  maxHP: number;
  currentHP: number;
  svgElementId: string;
  destroyed?: boolean;
};

export type BossTemplate = {
  id: string;
  name: string;
  baseHP: number;
  parts: BossPart[];
  allowedTags: string[];
};

export type BossState = {
  id: string;
  name: string;
  totalHP: number;
  maxHP: number;
  parts: BossPart[];
  defeated: boolean;
};

export type ComboState = {
  streak: number;
  multiplier: number;
};

export type ScoreState = {
  total: number;
  lastRoundBase: number;
  lastRoundBonus: number;
  lastRoundTotal: number;
};

export type ValidationFeedbackMessage = {
  code: string;
  level: "error" | "info";
  params?: Record<string, string | number | boolean | null>;
  tokenId?: string;
};

export type ValidationInteractionOutcome = {
  mode: GameMode;
  sentenceId: string;
  interactionId: string;
  dimension: string;
  expected: string;
  received: string | null;
  correct: boolean;
};

export type ValidationResult = {
  correct: boolean;
  score: number;
  mistakes: string[];
  feedback?: ValidationFeedbackMessage[];
  interactionOutcomes?: ValidationInteractionOutcome[];
  breakdown?: Record<string, unknown>;
};

export type ModeValidator<UserInput = unknown> = (
  userInput: UserInput,
  sentence: Sentence
) => ValidationResult;

export type TagModeUserInput = {
  tokenIdToPOS: Record<string, string>;
  eligibleTokenIds?: string[];
};

export type StructureModeUserInput = {
  subjectTokenIds: string[];
  predicateTokenIds: string[];
  complementTokenIds?: string[];
  eligiblePartIds?: Array<"subject" | "predicate" | "complement">;
};

export type GNLinkModeUserInput = {
  dependentIdToNounId: Record<string, string>;
  eligibleLinkIds?: string[];
};

export type AgreementModeUserInput = {
  nounIdToGender: Record<string, string>;
  nounIdToNumber: Record<string, string>;
  eligibleNounIds?: string[];
};

export type StatsBucket = {
  attempts: number;
  correct: number;
  incorrect: number;
};

export type PlayerStats = {
  totals: StatsBucket;
  byMode: Partial<Record<GameMode, StatsBucket>>;
  byDimension: Record<string, StatsBucket>;
  byTag: Record<string, StatsBucket>;
  avgResponseTimeMs: number | null;
  timedRounds: number;
  confusionByDimension: Record<string, Record<string, Record<string, number>>>;
};

export type RoundAnswerConstraints = {
  lockedInteractionIds: string[];
  preAnsweredInteractionIds: string[];
  eligibleInteractionIds: string[];
};

export type AnswerTrackingState = {
  solvedKeys: Record<string, true>;
  roundIndex: number;
  playerStats: PlayerStats;
};

export type BossDamageEvent =
  | { type: "boss.part_damaged"; partId: string; damage: number; remainingHP: number }
  | { type: "boss.part_destroyed"; partId: string; overflowDamage: number }
  | { type: "boss.defeated" };

export type BattleState = {
  currentSentence: Sentence;
  currentMode: GameMode;
  bossState: BossState | null;
  comboState: ComboState;
  scoreState: ScoreState;
  answerTracking: AnswerTrackingState;
};

export type RoundResult = ValidationResult & {
  comboState: ComboState;
  scoreState: ScoreState;
  bossState: BossState | null;
  bossEvents: BossDamageEvent[];
  constraints: RoundAnswerConstraints;
  playerStats: PlayerStats;
};

export type RoundPayload = {
  mode: GameMode;
  sentence: Sentence;
  userInput: unknown;
  elapsedMs?: number;
};
