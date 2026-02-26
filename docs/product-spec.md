# Grammar Boss Battle Product Specification

Version: 0.1  
Target Platform: Web app (desktop-first, tablet-compatible)

## 1. Product Overview

Grammar Boss Battle is a browser-based educational combat game where players defeat animated bosses by correctly analyzing French sentences (Grade 6 level).

### Learning Objectives

1. Identify word classes (variable and invariable categories).
2. Identify subject, predicate, and complement.
3. Identify and link GN (groupe nominal) components.
4. Determine gender and number agreement.

### Core Product Pillars

1. Immediate feedback.
2. Visible boss damage.
3. Modular learning modes.
4. Replayable progression loops.
5. Adaptive practice selection toward weak grammar tags.

## 2. Core Design Principles

1. Fast micro-loops (10-30 seconds per challenge).
2. Immediate visual feedback after validation.
3. Damage feedback beyond HP (body part destruction).
4. Mode modularity (each learning type is isolated).
5. Content-first design (JSON schema is primary).
6. Iteration-friendly architecture.

## 3. MVP Game Modes

### Mode A: POS Tagging

Player assigns a part of speech to each token.

### Mode B: Sentence Structure

Player identifies:

1. Subject
2. Predicate
3. Complement (if present)

Current MVP scoring for Structure mode is part-exact:
- +1 for correct Subject set
- +1 for correct Predicate set
- +1 for correct Complement set when complement exists

### Mode C: GN Linking

Player links:

1. Determiner -> noun
2. Adjective -> noun

Current MVP scoring for GN Linking is link-exact:
- +1 for each correct determiner/adjective -> noun link

### Mode D: Gender and Number

Player selects gender and number for nouns.

Current MVP scoring for Agreement mode is noun-exact:
- +1 for each noun where both gender and number are correct

## 4. Core Game Loop

Micro-loop target: 10-30 seconds.

1. Load sentence.
2. Load challenge mode.
3. Capture player interaction.
4. Validate result.
5. Calculate damage.
6. Apply damage to boss state.
7. Animate results.
8. Load next sentence using adaptive weak-tag weighting.

## 5. Functional Requirements

### 5.1 Sentence Engine

Must:

1. Render tokens individually.
2. Support interaction overlays.
3. Support multiple validation modes.
4. Load from local JSON content files.

### 5.2 Validation Engine

Must:

1. Remain pure logic with no UI coupling.
2. Return structured `ValidationResult`.
3. Track per-interaction outcomes for battle-level analytics.
4. Lock previously solved interactions when the same sentence appears again in the same battle.
5. Track per-tag accuracy stats and round timing aggregates for adaptive selection.

```ts
type ValidationResult = {
  correct: boolean;
  score: number;
  mistakes: string[];
  feedback?: Array<{
    code: string;
    level: "error" | "info";
    params?: Record<string, string | number | boolean | null>;
    tokenId?: string;
  }>;
  breakdown?: object;
};
```

### 5.3 Boss System

Boss must include:

1. Total HP
2. Independent parts with HP
3. SVG visual representation

Damage priority:

1. Apply to active part.
2. If part reaches zero, mark as destroyed and animate removal.
3. Carry overflow damage to next part.

### 5.4 Scoring System

1. Base score per correct interaction.
2. Combo multiplier.
3. Optional speed bonus.
4. Only currently eligible interactions count toward score and damage.
5. Current pacing bonus path awards a small bonus for 10-30 second rounds.

### 5.5 Combo System

1. +1 combo for fully correct round.
2. Reset on incorrect round.
3. Multiplier scales 1x -> 2x -> 3x (max).

### 5.6 Adaptive Difficulty Selector

1. Sentence selection is weighted toward weaker sentence tags.
2. Tag weakness is computed from tracked per-tag correctness ratios.
3. Selector remains deterministic with stable tie-breaking.

## 6. Non-Functional Requirements

1. Initial load target under 2 seconds.
2. No backend required for MVP.
3. All content stored as local JSON.
4. Offline-ready behavior is preferred (optional PWA).
5. Animation target 60 FPS where feasible.

## 7. Future Extensions

1. Procedural sentence generation.
2. Multiplayer modes.
3. Daily challenge.
4. Level map progression.
5. Expanded sound design.
