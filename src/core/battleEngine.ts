import { applyBossDamage } from "../boss/DamageSystem";
import { getRoundConstraints, updateAnswerTrackingState } from "./answerTracking";
import { initialComboState, updateComboState } from "./combo";
import { initialScoreState, calculateRoundScore, applyRoundScore } from "./score";
import type {
  AgreementModeUserInput,
  BattleState,
  GameMode,
  GNLinkModeUserInput,
  RoundPayload,
  RoundResult,
  Sentence,
  StructureModeUserInput,
  TagModeUserInput,
} from "./types";
import { validateAgreementMode } from "./validateAgreementMode";
import { validateGNLinkMode } from "./validateGNLinkMode";
import { validateStructureMode } from "./validateStructureMode";
import { validateTagMode } from "./validateTagMode";
import { createInitialAnswerTrackingState } from "./answerTracking";

const validators = {
  tagging: validateTagMode,
  structure: validateStructureMode,
  "gn-link": validateGNLinkMode,
  agreement: validateAgreementMode,
} as const;

const applyEligibilityToInput = (mode: GameMode, userInput: unknown, eligibleIds: string[]): unknown => {
  if (mode === "tagging") {
    const tagInput = userInput as TagModeUserInput;
    return {
      ...tagInput,
      eligibleTokenIds: eligibleIds,
    };
  }

  if (mode === "structure") {
    const structureInput = userInput as StructureModeUserInput;
    return {
      ...structureInput,
      eligiblePartIds: eligibleIds as Array<"subject" | "predicate" | "complement">,
    };
  }

  if (mode === "gn-link") {
    const linkInput = userInput as GNLinkModeUserInput;
    return {
      ...linkInput,
      eligibleLinkIds: eligibleIds,
    };
  }

  const agreementInput = userInput as AgreementModeUserInput;
  return {
    ...agreementInput,
    eligibleNounIds: eligibleIds,
  };
};

export type BattleEngine = {
  getState(): BattleState;
  getRoundConstraints(payload: { mode: GameMode; sentence: Sentence }): ReturnType<typeof getRoundConstraints>;
  submitRound(payload: RoundPayload): RoundResult;
  reset(payload: { sentence: Sentence; mode: GameMode; bossState: BattleState["bossState"] }): void;
};

/**
 * Battle engine is the single state transition boundary shared by all UI modes.
 */
export const createBattleEngine = (initial: {
  sentence: Sentence;
  mode: GameMode;
  bossState: BattleState["bossState"];
}): BattleEngine => {
  let state: BattleState = {
    currentSentence: initial.sentence,
    currentMode: initial.mode,
    bossState: initial.bossState,
    comboState: initialComboState,
    scoreState: initialScoreState,
    answerTracking: createInitialAnswerTrackingState(),
  };

  return {
    getState: () => state,

    getRoundConstraints: ({ mode, sentence }) => {
      return getRoundConstraints({
        mode,
        sentence,
        tracking: state.answerTracking,
      });
    },

    submitRound: (payload) => {
      const constraints = getRoundConstraints({
        mode: payload.mode,
        sentence: payload.sentence,
        tracking: state.answerTracking,
      });

      const validator = validators[payload.mode];
      const eligibleInput = applyEligibilityToInput(payload.mode, payload.userInput, constraints.eligibleInteractionIds);
      const validationResult = validator(eligibleInput as never, payload.sentence);

      const nextCombo = updateComboState(state.comboState, validationResult.correct);
      const roundScore = calculateRoundScore(
        payload.elapsedMs === undefined
          ? {
              baseScore: validationResult.score,
              comboMultiplier: nextCombo.multiplier,
            }
          : {
              baseScore: validationResult.score,
              comboMultiplier: nextCombo.multiplier,
              elapsedMs: payload.elapsedMs,
            }
      );
      const nextScore = applyRoundScore(state.scoreState, roundScore);

      let nextBossState = state.bossState;
      let bossEvents: RoundResult["bossEvents"] = [];
      if (nextBossState) {
        const damageResult = applyBossDamage(nextBossState, roundScore.total);
        nextBossState = damageResult.bossState;
        bossEvents = damageResult.events;
      }

      const nextTracking = updateAnswerTrackingState(
        state.answerTracking,
        payload.elapsedMs === undefined
          ? {
              mode: payload.mode,
              sentence: payload.sentence,
              validationResult,
            }
          : {
              mode: payload.mode,
              sentence: payload.sentence,
              validationResult,
              elapsedMs: payload.elapsedMs,
            }
      );

      state = {
        currentSentence: payload.sentence,
        currentMode: payload.mode,
        bossState: nextBossState,
        comboState: nextCombo,
        scoreState: nextScore,
        answerTracking: nextTracking,
      };

      return {
        ...validationResult,
        comboState: nextCombo,
        scoreState: nextScore,
        bossState: nextBossState,
        bossEvents,
        constraints,
        playerStats: nextTracking.playerStats,
      };
    },

    reset: (payload) => {
      state = {
        currentSentence: payload.sentence,
        currentMode: payload.mode,
        bossState: payload.bossState,
        comboState: initialComboState,
        scoreState: initialScoreState,
        answerTracking: createInitialAnswerTrackingState(),
      };
    },
  };
};
