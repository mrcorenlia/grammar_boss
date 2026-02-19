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

### Mode C: GN Linking

Player links:

1. Determiner -> noun
2. Adjective -> noun

### Mode D: Gender and Number

Player selects gender and number for nouns.

## 4. Core Game Loop

Micro-loop target: 10-30 seconds.

1. Load sentence.
2. Load challenge mode.
3. Capture player interaction.
4. Validate result.
5. Calculate damage.
6. Apply damage to boss state.
7. Animate results.
8. Load next sentence.

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

```ts
type ValidationResult = {
  correct: boolean;
  score: number;
  mistakes: string[];
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

### 5.5 Combo System

1. +1 combo for fully correct round.
2. Reset on incorrect round.
3. Multiplier scales 1x -> 2x -> 3x (max).

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
