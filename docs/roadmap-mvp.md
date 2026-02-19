# Grammar Boss Battle MVP Roadmap

Version: 0.1  
Duration: 4-6 weeks

## Week 1

1. Initialize project tooling and TypeScript strict mode.
2. Finalize sentence and boss schemas.
3. Implement base validation engine contracts.
4. Render static sentence tokens in UI.

Exit criteria:

1. Sample sentence JSON validates.
2. Token rendering uses token ids, not indices.
3. At least one validation unit test is passing.

## Week 2

1. Ship POS tagging mode end-to-end.
2. Implement scoring calculation.
3. Implement combo state and multiplier behavior.

Exit criteria:

1. POS mode validates and returns `ValidationResult`.
2. Combo increments/resets correctly.
3. Unit tests cover POS validation and combo rules.

## Week 3

1. Add boss HP model and state integration.
2. Add baseline SVG boss renderer.
3. Emit and handle damage events.

Exit criteria:

1. Correct answers can reduce boss HP.
2. HP bar reflects engine state.
3. Boss state transitions happen only through `battleEngine`.

## Week 4

1. Implement GN linking mode.
2. Implement sentence structure mode.
3. Add mode switching across implemented validators.

Exit criteria:

1. Both modes validate via pure functions.
2. UI remains mode-specific and engine-agnostic.
3. Unit tests exist for both new validators.

## Week 5-6

1. Add body-part destruction visuals.
2. Add animation polish and sound hooks.
3. Add first pass of adaptive difficulty weighting.

Exit criteria:

1. Boss parts are independently destructible.
2. Animation is idempotent and event-driven.
3. Adaptive selector uses `accuracyByTag` and response time.
