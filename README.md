# Grammar Boss Battle

Grammar Boss Battle is a modular web-based educational combat game. Players defeat bosses by correctly analyzing French grammar in short challenge loops.

This repository has completed Iteration 4 (Score and Combo), after completing Iteration 3 (Basic UI Shell), Iteration 2 (Core Validation Engine), Iteration 1 (Content Contracts), and the Iteration 0 scaffold setup.

## Guiding Architecture

`AGENTS.md` is the source of truth for architecture and implementation rules.

Core principles:

- Engine is UI-agnostic.
- Validation logic is pure and deterministic.
- Animation reacts to engine events.
- Content is JSON data, not inline logic.
- Global state transitions happen only through `battleEngine`.

Separation of concerns:

- `src/core` contains no React.
- `src/modes` contains no validation logic.
- `src/boss` does not calculate score.
- `src/content` contains no logic.

## Current Status

Implemented now:

- React + TypeScript + Vite project setup.
- Core shared domain types in `src/core/types.ts`.
- Core exports in `src/core/index.ts`.
- Seed content in `src/content/sentences.json` and `src/content/bosses.json`.
- Test tooling setup via Vitest.

Completed recently:

- Iteration 1 content contract hardening and validation coverage.
- Iteration 2 core validation interfaces and POS validator baseline.
- Iteration 4 score/combo engine integration with deterministic tests.

In progress now:

- Iteration 5 boss HP integration is in progress (boss data model and sequential damage system completed).

Planned next layers (see docs roadmap):

1. Engine-only validation/scoring pipeline.
2. Mode UIs wired to validators.
3. Boss HP + part damage model.
4. Animation/event polish.

## Project Structure

```text
.
├── src/
│   ├── core/          # Engine-facing contracts and pure logic (no React)
│   ├── content/       # JSON content only (sentences, bosses)
│   ├── App.tsx        # Temporary scaffold UI
│   └── main.tsx       # React entrypoint
├── docs/
│   ├── README.md
│   ├── product-spec.md
│   ├── technical-spec.md
│   ├── data-content-spec.md
│   ├── roadmap-mvp.md
│   └── iterative-development-plan.md
└── AGENTS.md          # Architecture source of truth
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Run Dev Server

```bash
npm run dev
```

### Type Check

```bash
npm run typecheck
```

### Run Tests

```bash
npm test
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Core Data Contracts

The shared state contract includes:

- `currentSentence`
- `currentMode`
- `bossState`
- `comboState`
- `scoreState`

Validation functions must:

- Accept `(userInput, sentence)`
- Return `ValidationResult`
- Be deterministic
- Avoid argument mutation

Token interactions must be id-driven (`token.id`), never index-driven.

## Documentation

Start here for specifications and implementation planning:

- `docs/README.md`
- `docs/product-spec.md`
- `docs/technical-spec.md`
- `docs/data-content-spec.md`
- `docs/roadmap-mvp.md`
- `docs/iterative-development-plan.md`

If there is any conflict between docs, `AGENTS.md` takes precedence.

## Contributing Notes

When adding features:

- Modify one system at a time.
- Keep strict TypeScript typing.
- Avoid coupling UI and engine logic.
- Add unit tests for every validation function.
- Keep documentation in `docs/` updated in the same change.
