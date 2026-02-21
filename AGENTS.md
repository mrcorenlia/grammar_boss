# AGENTS.md

## Project: Grammar Boss Battle

This project is a modular web-based educational combat game.

### Core Design Philosophy

1. Engine must remain UI-agnostic.
2. Validation logic must be pure functions.
3. Animation must subscribe to engine events.
4. Content must be data-driven (JSON-based).
5. No mode may directly modify global game state.
6. Make thorough use of tutorial-style comments across code components and core contracts and ensure the comments remain up-to-date

---

## Architectural Rules

### 1. Separation of Concerns

- `/core` contains no React.
- `/modes` contains no validation logic.
- `/boss` does not calculate score.
- `/content` contains no logic.

---

### 2. Validation Functions

All validation functions must:

- Be deterministic.
- Accept (userInput, sentence).
- Return ValidationResult.
- Not mutate arguments.

---

### 3. State Management

Global state should include:

- currentSentence
- currentMode
- bossState
- comboState
- scoreState

State transitions must occur only via the battleEngine.

---

### 4. UI Interaction Rules

- Word rendering must be token-driven.
- Tokens must be identified by id, not index.
- UI must never assume word order.

---

### 5. Boss Rules

- Boss parts are independent.
- Damage flows through parts sequentially.
- Visual state reflects data state.

---

### 6. Iteration Guidelines for Codex

When requesting new features:

- Modify only one system at a time.
- Do not refactor entire architecture unless explicitly requested.
- Maintain TypeScript strict typing.
- Avoid coupling UI and engine.

---

### 7. Testing

All validation functions must have unit tests.

Example:

- validateTagMode.test.ts
- validateStructureMode.test.ts

---

### 8. Content Rules

- All sentences must conform to schema.
- No inline hardcoded answers.
- Difficulty must be an integer (1–5).

---

### 9. Animation Rules

- Animation functions must be idempotent.
- Use CSS classes rather than inline styles when possible.
- SVG parts must have stable ids.

---

### 10. Future-Proofing

The system must allow:

- Adding new modes without refactoring engine.
- Adding new bosses without altering validation.
- Replacing the UI without altering core logic.

---

END OF AGENTS.md
