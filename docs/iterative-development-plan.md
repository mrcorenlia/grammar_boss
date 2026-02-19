# Iterative Development Plan

Version: 0.1  
Collaboration model: one system at a time, AGENTS-first

## 1. Working Rules

1. Follow `AGENTS.md` as the top-level architecture contract.
2. Modify one system per iteration.
3. Keep TypeScript strict typing at each step.
4. Every validator change includes unit tests.
5. Update relevant `/docs` files in the same change.

## 2. Iteration Sequence

### Iteration 0: Foundation

Scope:

1. Bootstrap Vite + React + TypeScript strict config.
2. Create `/src` folders from target architecture.
3. Add core shared types.

Done when:

1. Project builds locally.
2. Folder boundaries exist and are enforced by convention.
3. `ValidationResult` and state types are defined.

### Iteration 1: Content Contracts

Scope:

1. Add `sentences.json` and `bosses.json` with schema-aligned fixtures.
2. Add lightweight schema validation utilities/tests.
3. Guarantee token ids and difficulty constraints.

Done when:

1. Fixture content loads without runtime errors.
2. Invalid content fails tests.
3. No mode contains hardcoded answer data.

### Iteration 2: Core Validation Engine

Scope:

1. Implement pure validator interfaces in `/core`.
2. Implement POS mode validation first.
3. Add deterministic/non-mutation tests.

Done when:

1. POS validator accepts `(userInput, sentence)` and returns `ValidationResult`.
2. Tests cover pass/fail and mutation guard behavior.
3. No React dependencies inside `/core`.

### Iteration 3: Basic UI Shell

Scope:

1. Render tokenized sentence UI from JSON content.
2. Add mode selection shell.
3. Connect UI actions to `battleEngine` entrypoint only.

Done when:

1. UI uses token ids for interaction mapping.
2. Validation feedback appears for POS mode.
3. UI cannot mutate global state directly.

### Iteration 4: Score and Combo

Scope:

1. Implement score calculation module.
2. Implement combo module and multiplier limits.
3. Integrate score/combo into engine result pipeline.

Done when:

1. Correct rounds increase combo.
2. Incorrect rounds reset combo.
3. Score output is reproducible in tests.

### Iteration 5: Boss HP Integration

Scope:

1. Implement boss model and sequential damage logic.
2. Add HP bar UI.
3. Emit boss damage events from engine.

Done when:

1. Overflow damage correctly carries between parts.
2. Boss state updates are event and engine driven.
3. `/boss` module contains no scoring logic.

### Iteration 6: Additional Learning Modes

Scope:

1. Add Structure mode validator + UI.
2. Add GN linking mode validator + UI.
3. Add Agreement mode validator + UI.

Done when:

1. Each mode has isolated validator tests.
2. Mode UI components contain interaction logic only.
3. Engine remains mode-agnostic through validator registry.

### Iteration 7: Part Destruction and Animation

Scope:

1. Add SVG part-level state and destruction rendering.
2. Implement flash/shake/crack/explode sequence.
3. Ensure animation idempotency under repeated events.

Done when:

1. Destroyed parts are removed by stable SVG ids.
2. Repeat events do not double-apply visual state.
3. Animation is class/event-driven, not inline-style driven.

### Iteration 8: Polish and Adaptive Difficulty

Scope:

1. Add optional timer and speed bonus.
2. Implement first-pass adaptive sentence selector.
3. Tune challenge pacing and progression.

Done when:

1. `PlayerStats` updates per round.
2. Sentence selection weights weaker tags.
3. No architecture boundary regressions are introduced.

## 3. Definition of Done Per Iteration

1. Code and tests pass for touched modules.
2. Architecture constraints in `AGENTS.md` remain satisfied.
3. Relevant spec docs in `/docs` are updated.
4. Changelog note is added in commit or PR description.

## 4. How We Will Work Through This Together

1. Start each iteration by selecting exactly one scope above.
2. Implement only that scope plus required tests.
3. Run validation/tests for touched systems.
4. Update docs before closing the iteration.
5. Review acceptance criteria and then proceed to next iteration.
