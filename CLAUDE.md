# ai-lexicon-2026 — Claude project notes

> Read this first when working in this repo. Tactical plan in [PLAN.md](./PLAN.md), product alignment in [.runbooks/intent.md](./.runbooks/intent.md), shared vocabulary in [.runbooks/ubiquitous_language.md](./.runbooks/ubiquitous_language.md).

## What this is

A vintage-Risograph-poster reference for 2026 agentic AI terminology — currently a single hand-written `index.html` (~2000 lines, cards inlined). The active rebuild turns it into an **applied-fluency engine** for non-technical professionals: same lexicon, plus per-persona role overlays and copy-pasteable applicable artifacts. See [intent.md](./.runbooks/intent.md) for the thesis.

## Stack

- Static HTML + CSS + a small amount of inline JS. No framework, no bundler.
- Build = HTML minification (`html-minifier-terser`) + copying `public/` into `dist/`.
- Phase 1 (in flight) adds a Node ESM render step that turns `content/deck.json` + `content/cards/*.json` into card markup before minification. No new runtime dependencies.
- Deployed on Vercel from `main`.

## Invariants — do not break these without updating intent.md

1. **Static at runtime.** No backend, no live LLM calls in the deployed site (Phases 1–3). Phase 4 may add an opt-in BYO-key client-side path; treat that as a separate, gated feature, not a default.
2. **Deterministic build.** Same `content/**` + template → byte-identical `dist/index.html`.
3. **JSON is the source of truth for cards** once Phase 1 lands. The renderer is the only thing allowed to write card markup into the page.
4. **Human-reviewed content.** Generated overlays must carry `reviewed_by` / `reviewed_at` before rendering as reviewed.
5. **Poster aesthetic stays loud.** Risograph palette, Anton/Archivo/Fraunces/DM Mono. Overlays/artifacts can be sober; the frame should not.

## Decision-update convention (important)

When work introduces a **big decision** (audience shift, scope change, invariant relaxation, persona added/removed, phase exit) or a **new alignment** (we're now optimizing for X, not Y), do all three in the same PR:

1. Make the change.
2. Update [.runbooks/intent.md](./.runbooks/intent.md) — body change + a new line at the top of the Decision log (`YYYY-MM-DD — title — one-line summary — link`).
3. Update [PLAN.md](./PLAN.md) (and [.runbooks/ubiquitous_language.md](./.runbooks/ubiquitous_language.md) if a term's meaning shifts).

If you can't articulate why intent.md needs to change, the change is probably tactical and intent.md does not need to move — but PLAN.md likely still does.

## Repo map

| Path | Purpose |
|---|---|
| `index.html` | Live page. Cards currently inline; will reference rendered fragments after Phase 1 cutover. |
| `public/` | Static assets (favicon, og-image, robots). |
| `dist/` | Build output. Do not edit by hand. |
| `content/deck.json` | Deck meta — categories, personas. |
| `content/cards/*.json` | One card per file. Schema in `content/schema/card.schema.json`. |
| `content/schema/` | JSON Schemas for content files. |
| `scripts/build/render.mjs` | Prebuild renderer. Node ESM, no deps. |
| `scripts/build/README.md` | How the renderer works + cutover plan. |
| `scripts/authoring/` | Offline agentic content pipeline (Phase 3+). Not part of `npm run build`. |
| `.runbooks/intent.md` | Product thesis, invariants, decision log. Update on big calls. |
| `.runbooks/ubiquitous_language.md` | Shared vocabulary across humans + agents. |
| `PLAN.md` | Active rollout plan + Phase 1 status. |
| `CONTRIBUTING.md` | One-PR-per-major-task workflow + commit/review conventions. |

## Working conventions

- **One PR per major task**, multiple focused commits inside. See [CONTRIBUTING.md](./CONTRIBUTING.md).
- **Card IDs are kebab-case**, one card per JSON file, file name matches `id`.
- **Don't edit `index.html` cards by hand once extracted.** Edit the JSON, re-run the renderer.
- **Don't add a framework, bundler, or runtime dependency** without updating intent.md — the no-deps property is load-bearing for "this thing just works in any browser".
- **When editing the deck schema** (`content/schema/card.schema.json`), update `ubiquitous_language.md` if a term's meaning changes, and bump `deck.version` in `content/deck.json`.
- **Don't run `git commit` unprompted.** The author commits manually after reviewing diffs.

## Common gotchas

- The Risograph color palette is in CSS variables at the top of `index.html` (`--riso-*`). Category colors are wired to those — don't recolor a category without checking the back-cat block (`.card.cat-X .card-back-cat { background: ...; }`).
- The header has `splotch` decorations and reduced-motion handling already; respect `prefers-reduced-motion: reduce` for any new animation.
- `og-image.png` is the social card; if marketing copy changes meaningfully, regenerate it.
- The build does not lint or validate JSON yet — schema validation is a Phase 1 deliverable. Until then, hand-check card files.

## When in doubt

1. Re-read [intent.md](./.runbooks/intent.md) to confirm the change matches the thesis.
2. Re-read [PLAN.md](./PLAN.md) for the current phase's exit criterion.
3. If still unclear, ask the author before writing code that touches invariants.
