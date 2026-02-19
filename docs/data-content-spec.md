# Grammar Boss Battle Data and Content Specification

Version: 0.1  
Scope: Sentence content schema, boss schema, and validation-ready data rules

## 1. Sentence Schema

```ts
type Sentence = {
  id: string;
  text: string;
  difficulty: number; // 1-5
  tags: string[];
  tokens: Token[];
  structure: {
    subjectTokenIds: string[];
    predicateTokenIds: string[];
    complementTokenIds?: string[];
  };
  groups: {
    gn: GNGroup[];
    phrases?: PhraseGroup[];
  };
};

type Token = {
  id: string;
  text: string;
  lemma?: string;
  partOfSpeech: PartOfSpeech;
  gender?: "m" | "f";
  number?: "s" | "p";
  headId?: string;
};

type GNGroup = {
  nounId: string;
  determinerId?: string;
  adjectiveIds?: string[];
};

type PhraseGroup = {
  type: "prepositional";
  tokenIds: string[];
};
```

## 2. Sentence Example

```json
{
  "id": "s1",
  "text": "La petite maison rouge est belle.",
  "difficulty": 2,
  "tags": ["agreement", "gn"],
  "tokens": [
    { "id": "t1", "text": "La", "partOfSpeech": "DET", "gender": "f", "number": "s" },
    { "id": "t2", "text": "petite", "partOfSpeech": "ADJ", "gender": "f", "number": "s" },
    { "id": "t3", "text": "maison", "partOfSpeech": "NOUN", "gender": "f", "number": "s" },
    { "id": "t4", "text": "rouge", "partOfSpeech": "ADJ", "gender": "f", "number": "s" },
    { "id": "t5", "text": "est", "partOfSpeech": "VERB" },
    { "id": "t6", "text": "belle", "partOfSpeech": "ADJ", "gender": "f", "number": "s" }
  ],
  "structure": {
    "subjectTokenIds": ["t1", "t2", "t3", "t4"],
    "predicateTokenIds": ["t5", "t6"]
  },
  "groups": {
    "gn": [
      {
        "nounId": "t3",
        "determinerId": "t1",
        "adjectiveIds": ["t2", "t4"]
      }
    ]
  }
}
```

## 3. Boss Schema

```ts
type BossTemplate = {
  id: string;
  name: string;
  baseHP: number;
  parts: BossPart[];
  allowedTags: string[];
};

type BossPart = {
  id: string;
  name: string;
  maxHP: number;
  currentHP: number;
  svgElementId: string;
};
```

Each `BossPart.svgElementId` must match a stable `<g id="...">` in the boss SVG.

## 4. Damage Visualization Sequence

1. Flash red.
2. Shake screen.
3. Apply crack class on active part.
4. If part destroyed:
   - Trigger explosion effect.
   - Remove SVG node.
   - Trigger sound effect.

Example SVG structure:

```html
<svg>
  <g id="horn_left"></g>
  <g id="horn_right"></g>
  <g id="arm_left"></g>
  <g id="arm_right"></g>
  <g id="core"></g>
</svg>
```

## 5. Content Rules

1. Every sentence must conform to schema.
2. No inline hardcoded answers in mode code.
3. `difficulty` must be numeric and restricted to 1-5.
4. Token ids must be unique per sentence.
5. All mode logic must reference token ids, not indices.

## 6. Phase 2 Adaptive Difficulty Data

```ts
type PlayerStats = {
  accuracyByTag: Record<string, number>;
  avgResponseTime: number;
};
```

Sentence selection should be weighted toward weaker tags.
