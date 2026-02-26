# Grammar Boss Battle

Grammar Boss Battle is a modular web app where players practice French grammar by attacking a multi-part boss through sentence analysis challenges.

## MVP Status

The iterative plan through Iteration 8 is implemented:

- Four playable modes: POS Tagging, Structure, GN Linking, Agreement.
- Deterministic engine validation and scoring with combo and optional speed bonus.
- Boss HP + part-based damage flow with event-driven animation states.
- Round timer + pacing feedback (10-30s target loop).
- Answer tracking (locked/pre-answered constraints, confusion stats, tag stats).
- Adaptive sentence selection weighted toward weak tags.

## Architecture Rules

`AGENTS.md` is the source of truth.

- `src/core` contains no React.
- `src/modes` contains no validation logic.
- `src/boss` does not calculate score.
- `src/content` contains no logic.
- Global state transitions flow through `battleEngine`.

## Getting Started

Prerequisites:

- Node.js 20+
- npm 10+

Commands:

```bash
npm install
npm run dev
npm test
npm run typecheck
npm run build
npm run preview
```

## Project Structure

```text
src/
  core/        # Pure engine logic and contracts
  modes/       # Mode-specific UI shells
  boss/        # Boss model, damage system, renderer
  animation/   # Event-driven visual state reducers/hooks
  content/     # JSON fixtures only
  ui/          # Shared presentational components
  App.tsx      # UI composition + engine integration
```

## Documentation

- `docs/README.md`
- `docs/product-spec.md`
- `docs/technical-spec.md`
- `docs/data-content-spec.md`
- `docs/roadmap-mvp.md`
- `docs/iterative-development-plan.md`

If docs conflict, `AGENTS.md` takes precedence.
