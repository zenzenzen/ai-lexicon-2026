# AI Lexicon — Applied Fluency Engine

> Living plan. Supersedes the prior "Engagement + Prebuild Deck Architecture" sketch.
> When a big decision or new alignment lands, also update [.runbooks/intent.md](./.runbooks/intent.md).

## Re-framed thesis

The original plan would have shipped an interactive study app for builders/operators. That makes a *better reference*, not a *different product*. The wedge that justifies this tool's existence is not "more cards + quiz mode" — it is:

> **A domain-aware AI fluency engine that turns every concept into an artifact a non-technical professional can apply to their actual job by end of day.**

The job-to-be-done is closing the "I know what RAG is, but I'm a marketing manager — what do I *do* with that on Tuesday morning?" gap. Knowledge → application → portable artifact, in one session.

The existing builder/operator deck is the technical spine. **Domain packs** (Marketing, Finance, Ops, Legal, HR, Sales, Education, Healthcare-admin, …) layer on top: same vocabulary, different *application surface* per role.

## What changes vs. the original plan

| Area | Original | Enriched |
|---|---|---|
| Audience | Builders/operators only | Builders/operators **+ domain professionals** (Marketing/Finance/Ops first) |
| Engagement modes | Browse, Quiz, Scenario, Progress | + **Apply** mode (artifact-producing) and **Role lens** switcher |
| Content unit | Card (term + definition + builder context) | Card with **per-role overlays** + ≥1 **applicable artifact** |
| Generation | Manual term curation | **Agentic content pipeline** (offline) authoring overlays + scenarios |
| Scope | One deck, ~120 cards inlined | One core deck + N domain packs (300–600+ overlays in steady state) |
| Runtime | Static, no API, no backend | Static for v1–v2; **optional BYO-key runtime** considered Phase 4 |

The static, prebuild, deterministic-output architecture from the original plan is preserved. The agentic layer runs at *authoring time*, not in the browser.

## Personas

1. **Builder/Operator** (existing) — wants precise vocabulary, system implications, failure modes.
2. **Marketing Practitioner** — what prompt, what workflow, what tool combination, what risk.
3. **Finance / FP&A Analyst** — where AI can/can't enter the trust boundary, audit and reproducibility, model-risk vocabulary.
4. **Operations / PM / Generalist** — workflow redesign cues, automation opportunity spotting.
5. *(later)* **Legal**, **HR**, **Sales**, **Healthcare admin**, **Education** — same overlay pattern.

Each card answers the same term differently per persona via a *role lens overlay*, but shares one canonical definition.

## Deck data model

Building on `deck / cards / paths`, with overlays added:

```jsonc
{
  "deck":  { "id", "title", "audience", "version", "categories": [...] },
  "cards": [
    {
      "id": "rag",
      "term": "RAG",
      "abbreviation": "Retrieval-Augmented Generation",
      "category": "core",
      "index": 12,
      "canonical_definition": "...",
      "builder_context": "...",
      "role_overlays": {
        "marketing": {
          "what_it_is_for_you": "...",
          "where_it_shows_up": ["chat-with-brand-docs", "support deflection", "competitive intel"],
          "watch_outs":        ["stale index = wrong claims", "PII in retrieval set"],
          "scenario": { "prompt": "...", "answer_id": "rag", "distractors": ["fine-tune","prompt-eng"] },
          "applicable_artifact": {
            "type": "prompt | checklist | workflow | spec | calc",
            "title": "Brand-doc Q&A starter prompt",
            "body": "...",
            "guardrails": ["..."],
            "ready_in_minutes": 10
          }
        },
        "finance": { "...": "..." },
        "ops":     { "...": "..." }
      },
      "related_ids":   ["embedding","vector-db","fine-tuning"],
      "evidence_links": [{ "label": "...", "url": "..." }]
    }
  ],
  "paths":        [{ "id", "label", "persona", "card_ids": [...] }],
  "domain_packs": [{ "id": "marketing", "label": "Marketing", "card_ids": [...], "path_ids": [...] }]
}
```

Hard rule from the original plan still holds: **same JSON in → same HTML out**. The role-lens switcher rerenders the *visible* overlay client-side; the static page contains all of it.

See also: [.runbooks/ubiquitous_language.md](./.runbooks/ubiquitous_language.md) for the precise meaning of "card", "overlay", "artifact", "persona", etc.

## Applicable artifact — the differentiator

Every card targeted at a non-technical persona must ship at least one artifact in one of these shapes:

- **Starter prompt** — paste into ChatGPT/Claude, fill 2 blanks, run.
- **Workflow checklist** — 5–10 steps tying the concept to a real recurring task (monthly close commentary, campaign brief QA, etc.).
- **Decision aid** — "use X if … / use Y if … / don't use AI here because …".
- **Risk/guardrail card** — what to never paste, what to always log, what to escalate.
- **Mini-spec** — a one-paragraph requirement snippet to hand to an internal builder/vendor.

UI surfaces these via a **Copy artifact** button on the card back, with a "ready in X min" badge. This is what converts "I learned" into "I shipped".

## Engagement modes

Original four (Browse, Quiz, Scenario, Progress) plus:

5. **Apply** — given a *role lens* and a card, render the artifact, let user copy and tick "I tried this". `tried` counts separately from `mastered`.
6. **Role lens switcher** — top-level control: `Builder | Marketing | Finance | Ops | …`. Switches overlay, scenarios, recommended path. Persisted in `localStorage`.
7. *(stretch, Phase 3+)* **My Stack** — user picks tools they actually use (Notion, HubSpot, Excel, Salesforce, Looker); Apply artifacts adapt examples accordingly. Still static; tool-matrix lookup, not live generation.

## Agentic content pipeline (offline)

```
[seed lexicon JSON]
    │
    ▼
[Extractor agent] ──► verifies canonical definition vs. recent sources, flags drift
    │
    ▼
[Role-overlay agent (per persona)] ──► drafts what_it_is_for_you / scenario / artifact
    │
    ▼
[Critic agent (skeptic)]   ──► challenges accuracy, removes hallucinated tools/features
    │
    ▼
[Reviewer (human)]         ──► approve / edit / reject
    │
    ▼
[Committed deck JSON] ──► prebuild renderer ──► static dist/
```

- Anthropic SDK; Claude Opus 4.7 for drafting, Haiku 4.5 for cheap critic passes; prompt caching on canonical definition + persona system prompts.
- Author scripts live under `scripts/authoring/` and are **not** part of `npm run build`. They produce JSON that you commit.
- Every generated artifact carries `generated_by`, `reviewed_by`, `reviewed_at`. Re-running drafts must not silently overwrite human edits.
- Diff-friendly: one card per file under `content/cards/<id>.json`; the deck is assembled at build time.

## Phased rollout

### Phase 1 — Architectural extraction (no user-visible change beyond Browse parity)

- Extract all current inline cards into `content/cards/*.json`.
- Add prebuild renderer (`scripts/build/render.mjs`) producing the same `index.html` markup that exists today.
- Update `package.json`: `build` = render → minify → copy public.
- Determinism test: byte-compare rendered HTML to a golden snapshot in CI.
- **Exit criterion:** visual diff ≤ ε vs. current site; all existing controls work.

### Phase 2 — Engagement layer (Quiz / Scenario / Progress / Browse)

- Implement the four modes against the extracted JSON.
- localStorage-backed progress with a clear reset action.
- Mode switcher near existing controls; respects reduced-motion.
- **Exit criterion:** a builder can quiz, see progress, refresh, and resume.

### Phase 3 — Domain packs + Apply mode (the differentiator ships here)

- Define `role_overlays` schema; pick **two launch personas** (recommend **Marketing** and **Finance/FP&A** — sharpest "empty hands" pain).
- Run agentic pipeline to draft overlays for an initial 50-card subset (Core + RAG/embeddings + agent fundamentals + governance/risk basics).
- Ship Role-lens switcher and Apply mode with copy-to-clipboard artifacts.
- "Try this on your own work" nudge after first artifact copy.
- **Exit criterion:** a marketing manager who has never written a prompt leaves with 3+ artifacts they pasted into their own tools.

### Phase 4 — Scale + adaptive layer

- Add Ops, Legal, HR, Sales personas (additive — content authoring, no architectural change).
- Grow card count to 300–600+ across overlays.
- Optional **BYO-key runtime layer**: a single client-side feature that lets the user paste their own Anthropic/OpenAI key locally to ask "apply this card to my situation: <paste>". Opt-in, no proxy, no logging, key never leaves the browser. The only place the static-only invariant relaxes — gated behind a clear toggle.
- **My Stack** tool-matrix overlay.

## Test plan additions

Keep all original tests (Browse, search, filters, flip, reveal, reset, keyboard, reduced-motion, mobile). Add:

- **Snapshot determinism** — `npm run build` twice yields byte-identical `dist/index.html`.
- **Schema validation** — every `content/cards/*.json` validates against the JSON Schema in CI; missing required fields fail the build.
- **Role lens switching** — toggling persona updates overlays without page reload, persists across refresh, and shows a "Builder lens — no role overlay yet" notice when a card has no overlay for the active persona.
- **Artifact copy** — clicking Copy artifact places clipboard content matching JSON `body` exactly.
- **Authoring scripts** — `scripts/authoring/*` run in dry-run mode in CI and exit clean (no network, no writes).
- **A11y for new controls** — Apply / Role-lens controls are keyboard-reachable, labeled, announced; reduced-motion respected.

## Risks & open questions

1. **Content authority risk.** Domain overlays must be accurate or the tool is worse than nothing for non-technical users. Mitigation: human review gate is non-negotiable; show "reviewed [date] by [name]" stamp on overlays; per-overlay `confidence: draft | reviewed | verified` flag.
2. **Scope explosion.** N personas × M cards × per-card artifacts = a lot. Mitigation: start with 2 personas × 50 cards = 100 overlays; agentic pipeline + human review is the unit-economics fix.
3. **"Empty hands" risk reappearing one level up.** A user could now hoard *artifacts* without applying them. Mitigation: Apply mode tracks `tried` separately from `viewed`; progress nudges toward trying.
4. **Static invariant vs. true personalization.** Phase 4's BYO-key layer is the philosophical break — make it explicit and gated, not a slide.
5. **Brand/voice drift.** The Risograph poster aesthetic is a real asset. Domain overlays must not turn the site into a corporate training portal. Keep the typography, the splotches, and the irreverent voice — the *artifacts* can be sober, the *frame* should not.

## Assumptions (refreshed)

- v1 keeps the AI Lexicon as a single deck; "decks" remain a future generalization, not a v1 concept.
- Phases 1–3 are 100% static at runtime. Only Phase 4 introduces an opt-in client-side LLM call.
- "Done" for Phase 3 means a non-technical user takes home at least one artifact that survived contact with their actual tools — the activation metric is *tried*, not *viewed*.

---

## Phase 1 — scaffolding (in progress)

This section tracks the actual files put in place during Phase 1 scaffolding. Update as work lands.

### What exists now

- **Deck meta** — [content/deck.json](./content/deck.json): categories (with section numbers, labels, descriptions, back-labels) + persona registry.
- **Card schema** — [content/schema/card.schema.json](./content/schema/card.schema.json): JSON Schema for individual card files.
- **Sample cards** (proof-of-shape, not full extraction yet):
  - [content/cards/agentic-ai.json](./content/cards/agentic-ai.json) — minimal card.
  - [content/cards/llm.json](./content/cards/llm.json) — card with `abbreviation`.
  - [content/cards/multimodal.json](./content/cards/multimodal.json) — card with `alternate_label` (front term differs from back face label).
- **Renderer skeleton** — [scripts/build/render.mjs](./scripts/build/render.mjs): Node ESM, no deps, deterministic. Reads deck + cards, emits a section-by-section HTML fragment matching the existing markup. Currently outputs to `dist/render-preview.html` for inspection while extraction is partial.
- **Scripts README** — [scripts/build/README.md](./scripts/build/README.md): how to run the renderer, intended cutover into the main build.
- **Authoring placeholder** — [scripts/authoring/](./scripts/authoring/): home for offline agentic scripts (empty for now).
- **`package.json`** — added `render` and `render:check` scripts; the existing `build` is unchanged so the live site is unaffected during scaffolding.

### Remaining Phase 1 work (next PRs)

1. Extract all 220 cards from `index.html` into `content/cards/*.json` (semi-automated; verify each).
2. Extend renderer to emit the full `<main>` block (currently just per-section grids).
3. Replace the inline cards in `index.html` with a render-time placeholder/marker, and have `render.mjs` splice the rendered HTML into the page template before minification.
4. Wire `render` into `npm run build` once the rendered output byte-matches a golden snapshot.
5. Add CI guard: `npm run render:check` fails if rendered HTML drifts from the committed snapshot.

### Convention reminder

When a Phase 1 decision changes audience, scope, or invariants (static-only, deterministic output, persona list, etc.), update [.runbooks/intent.md](./.runbooks/intent.md) with the new alignment and a one-line entry in the decision log.
