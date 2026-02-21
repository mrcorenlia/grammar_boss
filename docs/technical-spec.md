# Grammar Boss Battle Technical Specification

Version: 0.1  
Status: Living spec (must be updated with architecture changes)

## 1. Implementation Stack

Recommended:

1. React + TypeScript
2. Vite
3. Zustand or equivalent lightweight state store
4. SVG-based boss rendering and damage animation

## 2. Architecture Constraints (From AGENTS.md)

1. Engine is UI-agnostic.
2. Validation logic is deterministic pure functions.
3. Animation subscribes to engine events.
4. Content is data-driven (JSON).
5. Modes must not directly mutate global state.

Separation of concerns:

1. `/core` contains no React.
2. `/modes` contains no validation logic.
3. `/boss` contains no score calculations.
4. `/content` contains no logic.

## 3. Global State Contract

Required global state:

1. `currentSentence`
2. `currentMode`
3. `bossState`
4. `comboState`
5. `scoreState`

All state transitions must flow through `battleEngine`.

## 4. Core Module Contracts

### 4.1 Validation Contract

All mode validation functions must:

1. Accept `(userInput, sentence)`.
2. Return `ValidationResult`.
3. Be deterministic.
4. Avoid argument mutation.

```ts
export type ValidationResult = {
  correct: boolean;
  score: number;
  mistakes: string[];
  breakdown?: Record<string, unknown>;
};

export type ModeValidator<UserInput = unknown> = (
  userInput: UserInput,
  sentence: Sentence
) => ValidationResult;

export type TagModeUserInput = {
  tokenIdToPOS: Record<string, string>;
};
```

### 4.2 Battle Engine Contract

`battleEngine` responsibilities:

1. Receive player action payloads from UI modes.
2. Route payload to mode-specific validator.
3. Calculate scoring and combo effects.
4. Convert score to boss damage.
5. Emit event payloads for animation and UI feedback.
6. Commit state transitions.

### 4.3 Boss Damage Contract

Boss parts are independent data units. Damage flows sequentially through parts.

Processing order:

1. Apply incoming damage to current active part.
2. If part HP <= 0, mark destroyed and emit destruction event.
3. Carry remaining damage to next part.
4. Emit boss defeated event when all parts are destroyed.

### 4.4 Animation Contract

Animation layer must:

1. Be idempotent.
2. Subscribe to engine events only.
3. Use stable SVG part ids.
4. Prefer CSS classes over inline styles.

### 4.5 Content Loading Contract

To prevent hardcoded answer coupling:

1. Mode code must not define inline answer keys.
2. Mode code must consume answer-bearing data via core content loading APIs.
3. Core content loaders are responsible for reading local JSON fixtures and validating shape before use.

## 5. UI Interaction Rules

1. Token rendering is token-driven.
2. Tokens are referenced by `id`, never by array index.
3. UI must not assume fixed word order.

## 6. Project Structure

```text
/src
  /core
    battleEngine.ts
    validation.ts
    validateTagMode.ts
    contentValidation.ts
    contentRepository.ts
    types.ts

  /content
    sentences.json
    bosses.json

  /modes
    TaggingMode.tsx
    StructureMode.tsx
    GNLinkMode.tsx
    AgreementMode.tsx

  /boss
    BossModel.ts
    BossRenderer.tsx
    DamageSystem.ts

  /ui
    SentenceRenderer.tsx
    HPBar.tsx
    ComboMeter.tsx
    Timer.tsx

  /animation
    effects.ts
    shake.ts
    explode.ts

  App.tsx
```

## 7. Iteration Layers

1. Layer 1: Engine-only (CLI validation, no UI, no animation).
2. Layer 2: Basic UI (sentence rendering, mode switch, validation feedback).
3. Layer 3: Boss integration (HP tracking and HP bar).
4. Layer 4: Body part destruction.
5. Layer 5: Polish (animation, sound, tuning).

Rule: never build animation before engine contracts are stable.

## 8. Testing Requirements

1. Each validation function has unit tests.
2. Suggested test files:
   - `validateTagMode.test.ts`
   - `validateStructureMode.test.ts`
3. Tests verify determinism and non-mutation behavior.
