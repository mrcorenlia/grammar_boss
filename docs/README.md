# Grammar Boss Battle Documentation

This folder contains the project specification for Grammar Boss Battle.

`AGENTS.md` is the architecture source of truth. If any document in `/docs` conflicts with `AGENTS.md`, `AGENTS.md` takes precedence.

## Documentation Map

1. `docs/product-spec.md`: Product goals, modes, game loop, and requirements.
2. `docs/technical-spec.md`: Architecture rules, engine contracts, state flow, and implementation layers.
3. `docs/data-content-spec.md`: Sentence/boss schemas, content constraints, and examples.
4. `docs/roadmap-mvp.md`: 4-6 week MVP timeline and delivery targets.
5. `docs/iterative-development-plan.md`: Issue-style task board with per-iteration checklists.

## Documentation Maintenance Rules

1. Update affected `/docs` files in the same change as implementation updates.
2. Keep type contracts synchronized with code contracts in `/src/core`.
3. Preserve AGENTS separation of concerns:
   - `/core` has no React.
   - `/modes` has no validation logic.
   - `/boss` has no scoring logic.
   - `/content` has no logic.
4. Keep all mode behavior token-id driven, never index-driven.
5. Track spec version changes at the top of updated files.
