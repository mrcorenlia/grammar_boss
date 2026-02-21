# Iterative Development Task Board

Version: 0.2  
Format: issue-style board with checklists  
Source of truth: `AGENTS.md` takes precedence over this document

## 1. Board Rules

1. Work one iteration at a time.
2. Complete all checklist items in an iteration before starting the next.
3. Keep architecture boundaries from `AGENTS.md` intact.
4. Add or update unit tests with every validation change.
5. Update affected `/docs` files in the same change as code.

## 2. Board Overview

| Iteration | System Focus | Issue Group | Depends On | Status |
| --- | --- | --- | --- | --- |
| 0 | Foundation | `I0-*` | None | Done |
| 1 | Content Contracts | `I1-*` | Iteration 0 | Done |
| 2 | Core Validation | `I2-*` | Iteration 1 | In Progress |
| 3 | Basic UI Shell | `I3-*` | Iteration 2 | Todo |
| 4 | Score and Combo | `I4-*` | Iteration 3 | Todo |
| 5 | Boss HP Integration | `I5-*` | Iteration 4 | Todo |
| 6 | Additional Modes | `I6-*` | Iteration 5 | Todo |
| 7 | Animation and Part Destruction | `I7-*` | Iteration 5 | Todo |
| 8 | Polish and Adaptive Difficulty | `I8-*` | Iteration 6, 7 | Todo |

## 3. Issues and Checklists

### Iteration 0: Foundation (`I0-*`)

Issue `I0-1`: Bootstrap project shell

- [x] Create Vite + React + TypeScript app scaffold.
- [x] Enable strict TypeScript settings.
- [x] Add baseline scripts for `build`, `test`, and `typecheck`.

Issue `I0-2`: Create architecture-aligned folder structure

- [x] Create `/src/core`, `/src/modes`, `/src/boss`, `/src/content`, `/src/ui`, `/src/animation`.
- [x] Add placeholder files where needed to lock structure.
- [x] Verify `/core` has no React imports.

Issue `I0-3`: Define base types

- [x] Add shared core types including `ValidationResult`.
- [x] Add initial state contracts: `currentSentence`, `currentMode`, `bossState`, `comboState`, `scoreState`.
- [x] Export types from a single stable entrypoint.

Iteration 0 exit checklist

- [x] Project builds locally.
- [x] Folder boundaries match `AGENTS.md`.
- [x] Base types compile under strict mode.

### Iteration 1: Content Contracts (`I1-*`)

Issue `I1-1`: Add schema-aligned fixtures

- [x] Create `src/content/sentences.json`.
- [x] Create `src/content/bosses.json`.
- [x] Ensure sentence `difficulty` is an integer and constrained to `1-5`.

Issue `I1-2`: Add content validation tests

- [x] Add tests that reject duplicate token ids.
- [x] Add tests that reject invalid difficulty values.
- [x] Add tests that reject missing required fields.

Issue `I1-3`: Remove hardcoded answer coupling

- [x] Confirm mode components do not embed answer keys.
- [x] Ensure answer data is loaded only from content files.

Iteration 1 exit checklist

- [x] Content fixtures load successfully.
- [x] Invalid fixtures fail tests.
- [x] Content rules from `AGENTS.md` are satisfied.

### Iteration 2: Core Validation Engine (`I2-*`)

Issue `I2-1`: Implement validator interfaces

- [x] Create validator interface accepting `(userInput, sentence)`.
- [x] Standardize validator outputs to `ValidationResult`.
- [x] Ensure no validator mutates inputs.

Issue `I2-2`: Implement POS tagging validator

- [x] Implement deterministic POS validation logic.
- [x] Include `mistakes` and score breakdown output.
- [x] Add round-level `correct` behavior.

Issue `I2-3`: Add validator unit tests

- [ ] Test pass and fail cases for POS mode.
- [ ] Add mutation-guard tests.
- [ ] Add determinism tests with repeated inputs.

Iteration 2 exit checklist

- [ ] POS validator is production-usable.
- [ ] Validator tests pass.
- [ ] `/core` remains UI-agnostic.

### Iteration 3: Basic UI Shell (`I3-*`)

Issue `I3-1`: Token-driven sentence renderer

- [ ] Render sentence tokens from content.
- [ ] Bind interactions by token id, not index.
- [ ] Do not assume fixed token order.

Issue `I3-2`: Mode shell and routing

- [ ] Add mode switch UI container.
- [ ] Add POS mode UI interaction flow.
- [ ] Route interaction payloads to `battleEngine` only.

Issue `I3-3`: Validation feedback UI

- [ ] Display correctness status.
- [ ] Display mistakes list.
- [ ] Keep validation logic out of `/modes`.

Iteration 3 exit checklist

- [ ] POS interaction works end-to-end through engine.
- [ ] UI does not mutate global state directly.
- [ ] Token-driven interaction rules are enforced.

### Iteration 4: Score and Combo (`I4-*`)

Issue `I4-1`: Score module

- [ ] Add base score calculation.
- [ ] Add optional speed bonus hook.
- [ ] Add deterministic score tests.

Issue `I4-2`: Combo module

- [ ] Add combo increment on fully correct rounds.
- [ ] Add combo reset on incorrect rounds.
- [ ] Cap multiplier progression at 3x.

Issue `I4-3`: Engine integration

- [ ] Integrate score and combo outputs into round result.
- [ ] Expose score/combo state through engine state transition.
- [ ] Add integration tests for score + combo interactions.

Iteration 4 exit checklist

- [ ] Score results are reproducible.
- [ ] Combo rules behave as specified.
- [ ] No scoring logic leaks into `/boss`.

### Iteration 5: Boss HP Integration (`I5-*`)

Issue `I5-1`: Boss data model

- [ ] Implement total HP and part HP structures.
- [ ] Map boss parts to stable SVG ids.
- [ ] Ensure part independence in state representation.

Issue `I5-2`: Sequential damage system

- [ ] Apply damage to active part first.
- [ ] Carry overflow damage to next part.
- [ ] Emit part-destroyed and boss-defeated events.

Issue `I5-3`: Boss UI baseline

- [ ] Add HP bar component.
- [ ] Reflect boss HP updates from engine state.
- [ ] Confirm `/boss` does not calculate score.

Iteration 5 exit checklist

- [ ] Damage flows through parts sequentially.
- [ ] HP UI reflects data state.
- [ ] Engine is the only state transition path.

### Iteration 6: Additional Learning Modes (`I6-*`)

Issue `I6-1`: Structure mode

- [ ] Implement structure validator in `/core`.
- [ ] Add Structure mode UI interactions.
- [ ] Add `validateStructureMode` tests.

Issue `I6-2`: GN linking mode

- [ ] Implement GN link validator in `/core`.
- [ ] Add GN link mode UI interactions.
- [ ] Add GN link validator tests.

Issue `I6-3`: Agreement mode

- [ ] Implement agreement validator in `/core`.
- [ ] Add Agreement mode UI interactions.
- [ ] Add agreement validator tests.

Iteration 6 exit checklist

- [ ] All new validators are pure and tested.
- [ ] `/modes` contains no validation logic.
- [ ] Engine remains mode-agnostic via validator dispatch.

### Iteration 7: Part Destruction and Animation (`I7-*`)

Issue `I7-1`: Visual damage states

- [ ] Add flash, shake, and crack states tied to engine events.
- [ ] Use CSS classes over inline styles.
- [ ] Keep animation methods idempotent.

Issue `I7-2`: Part destruction flow

- [ ] Trigger explosion on destroyed parts.
- [ ] Remove SVG nodes by stable part ids.
- [ ] Add sound hook points for destroyed events.

Issue `I7-3`: Animation reliability tests

- [ ] Add tests for repeated event idempotency.
- [ ] Add tests preventing duplicate destruction effects.
- [ ] Add tests for class cleanup between rounds.

Iteration 7 exit checklist

- [ ] Visual state consistently reflects data state.
- [ ] Repeat events do not double-apply effects.
- [ ] SVG ids remain stable and mapped.

### Iteration 8: Polish and Adaptive Difficulty (`I8-*`)

Issue `I8-1`: Timing and round polish

- [ ] Add timer UI and timing capture hooks.
- [ ] Add optional speed bonus calculation path.
- [ ] Tune round pacing for 10-30 second loops.

Issue `I8-2`: Adaptive difficulty selector

- [ ] Add `PlayerStats` tracking model.
- [ ] Update stats after each round.
- [ ] Weight sentence selection toward weak tags.

Issue `I8-3`: Final hardening

- [ ] Run full test suite and type checks.
- [ ] Review architecture boundaries against `AGENTS.md`.
- [ ] Update docs with final MVP behavior.

Iteration 8 exit checklist

- [ ] Adaptive selector works from tracked stats.
- [ ] MVP behavior is stable across all modes.
- [ ] Documentation reflects implemented behavior.

## 4. Global Completion Checklist (Every Iteration)

- [ ] Code and tests pass for touched modules.
- [ ] Architecture constraints from `AGENTS.md` remain satisfied.
- [ ] Relevant docs in `/docs` are updated.
- [ ] PR or commit includes change summary and test notes.
