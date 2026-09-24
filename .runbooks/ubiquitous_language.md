# Ubiquitous Language — AI Lexicon

> Shared vocabulary for humans and agents working on this repo. When a term used in code, JSON, or docs collides with one of these definitions, the definition here wins. New terms get added; renamed concepts get a deprecation note.
>
> Cross-refs: [intent.md](./intent.md) for the *why*, [../PLAN.md](../PLAN.md) for the *how*.

## Core nouns

### Card
The atomic content unit. One concept, one entry, one JSON file under [../content/cards/](../content/cards/). Renders as a flippable poster card on the public site. Every card has a stable `id` (kebab-case), one `category`, an `index` within that category, and a `canonical_definition`.

### Deck
The full set of cards plus the meta that describes them — categories, personas, paths, domain packs. Lives at [../content/deck.json](../content/deck.json) (meta) plus the cards directory. v1 ships a single deck named *AI Lexicon '26*; "deck" is kept as a concept so future generalization (other topic decks) is not foreclosed.

### Category (a.k.a. section)
A first-class grouping of cards: Core, Architecture, Ops, Patterns, Safety, Slang, JEPA, Failure Modes, Harness Engineering. Drives section heading, card class (`cat-X`), and back-label (e.g. "Core Concept"). Categories are taxonomy of *the field*; they are stable.

### Persona (a.k.a. role)
A user archetype the tool serves: `builder`, `marketing`, `finance`, `ops`, etc. A persona has its own viewing lens, recommended path, and overlay content per card. Personas are taxonomy of *the audience*; they expand over time.

### Role lens (a.k.a. lens)
The active persona at the UI level. Switching the role lens swaps which `role_overlays` entry renders on every card and which path is recommended. Persisted in `localStorage`. The default lens is `builder`.

### Role overlay (a.k.a. overlay)
The persona-specific content layered onto a card: `what_it_is_for_you`, `where_it_shows_up`, `watch_outs`, `scenario`, and `applicable_artifact`. A card may have zero or more overlays. A missing overlay for the active lens shows a graceful "no role overlay yet" notice — never empty space.

### Applicable artifact (a.k.a. artifact)
The portable, copy-pasteable thing a card hands a user: a prompt, checklist, decision aid, risk/guardrail card, or mini-spec. Artifacts are the unit of value the tool delivers; "did the user try this?" is a higher-priority signal than "did the user view this?".

### Domain pack
A curated subset of cards + paths bundled around a persona (e.g. "Marketing pack" = the cards a marketing practitioner most needs, in the order they most need them). Domain packs are how Phase 3+ ships new audiences without changing the deck schema.

### Path
An ordered list of card IDs forming a guided sequence (e.g. *RAG starter for marketers*). Paths are persona-aware and optional in v1; they become first-class in Phase 3.

### Canonical definition
The persona-agnostic, accuracy-first definition of a term — the same prose a builder would read. Lives on the card itself, not in any overlay. Overlays *reframe* the canonical; they do not *replace* it.

### Builder context
The pre-existing technical-audience commentary on a card (system implications, failure modes, where it sits in a stack). Treated as the `builder` persona's overlay-equivalent and rendered when the lens is `builder`.

### Confidence
Per-overlay flag — `draft | reviewed | verified`. Drafts must not render publicly under a reviewed badge. Used by the offline pipeline and review workflow.

## Build / runtime nouns

### Prebuild render
The offline step (`scripts/build/render.mjs`) that turns deck JSON + card JSON into the static HTML markup that ends up in `dist/`. The browser never does this work.

### Render-time placeholder
A marker in `index.html` (Phase 1 step 3) that tells the renderer where to splice the rendered card sections. Until then, cards remain inline and the renderer outputs a preview file for diffing.

### Static-only invariant
The rule that the deployed artifact (`dist/`) makes no network calls beyond fonts/assets — no LLMs, no backend. Held across Phases 1–3. Phase 4 may introduce a single, opt-in, client-side BYO-key path; if it ships, this invariant gets renamed to *static-by-default*.

### Deterministic build
Property: same input (deck/cards/template) → byte-identical `dist/index.html`. Enforced in CI via snapshot comparison. Required before `render` is wired into `npm run build`.

### Golden snapshot
A committed copy of the rendered HTML that `npm run render:check` diffs against. Updated intentionally when content or template changes; never updated by an automated agent without human approval.

### BYO-key runtime (Phase 4, conditional)
An opt-in client-side feature where the user pastes their own LLM API key locally to apply a card to their own situation. The key never leaves the browser; nothing is logged. This is the only allowed relaxation of the static-only invariant and ships behind a visible toggle.

## Authoring nouns

### Authoring pipeline
The offline chain — Extractor → Role-overlay agent → Critic → Reviewer → committed JSON — that produces and refreshes overlay content. Lives under [../scripts/authoring/](../scripts/authoring/). Not part of `npm run build`.

### Reviewer
The human (currently @zenzenzen) who approves a generated overlay before it can be marked `reviewed` or `verified`. Reviewers stamp `reviewed_by` and `reviewed_at` on the overlay.

### Drift
When the canonical definition has fallen behind reality (e.g., a model is renamed, a protocol is superseded). The Extractor agent flags suspected drift; the Reviewer decides.

## Verbs

### Browse
Default mode — read cards, search, flip, filter by category. Already supported.

### Quiz
Mode that shows term/definition multiple-choice or short-recall using existing card data. Phase 2.

### Scenario
Mode that asks "which concept applies here?" using persona-appropriate situations. Phase 2 with a builder lens; Phase 3 expands per-persona.

### Apply
Mode that surfaces a card's applicable artifact for the active role lens, lets the user copy it, and records a `tried` event. Phase 3.

### Try
The act of pasting/applying an artifact in a real tool. Tracked separately from `view` and `master`. The activation metric for the tool.

### Master
A persistent local flag (set when a user has demonstrated recall + applied at least once). Distinct from `tried`; mastery composes both knowledge and use.

## Conventions

- **IDs are kebab-case** — `vector-db`, not `VectorDB` or `vector_db`.
- **One card per file** — `content/cards/<id>.json`, where `<id>` matches the card's `id` field.
- **Numbers** — `index` is per-category, 1-based, contiguous unless explicitly versioned.
- **Categories** are: `core`, `arch`, `ops`, `patterns`, `safety`, `slang`, `jepa`, `failure`, `harness`. Adding a category requires updating [../content/deck.json](../content/deck.json), the renderer, the CSS palette in `index.html`, and this file.
- **Personas** referenced in code use the bare ID (`marketing`), never the human label (`Marketing Practitioner`). The deck's persona registry is the single source of truth for valid IDs.
