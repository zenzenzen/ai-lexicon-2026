# scripts/build

Prebuild scripts that turn the deck JSON into the HTML the browser actually renders.

> Concepts here are defined in [../../.runbooks/ubiquitous_language.md](../../.runbooks/ubiquitous_language.md). Why this layer exists: [../../.runbooks/intent.md](../../.runbooks/intent.md). Phase 1 status: [../../PLAN.md#phase-1--scaffolding-in-progress](../../PLAN.md#phase-1--scaffolding-in-progress).

## render.mjs

Pure Node ESM, no dependencies, deterministic output.

- **Inputs**
  - [../../content/deck.json](../../content/deck.json) — categories + persona registry.
  - [../../content/cards/*.json](../../content/cards/) — one card per file; filename must match the card's `id`.
- **Output (Phase 1 scaffolding)** — `dist/render-preview.html`. A standalone HTML fragment of the rendered card sections, suitable for diffing against the cards currently inlined in `index.html`.
- **Output (Phase 1 cutover, planned)** — splices into a placeholder in `index.html` so `dist/index.html` is fully rendered from JSON. The minifier then runs as it does today.

### Run it

```bash
node scripts/build/render.mjs
# or
npm run render
```

### Determinism

- Card files are read in sorted filename order; sections in deck.json order; cards within a section by `index`.
- All HTML escaping goes through one `escapeHtml`; no `JSON.stringify` of user content into HTML.
- No timestamps, no random IDs, no "generated at" comments. Same input → byte-identical output.
- `npm run render:check` (planned) will diff `render-preview.html` against `content/.golden/render-preview.html` and fail CI on drift.

## Cutover plan (still ahead in Phase 1)

1. Extract the remaining cards from `index.html` into `content/cards/*.json`.
2. Add a single render-time placeholder marker inside `<main>` in `index.html`, e.g. `<!-- {{cards}} -->`.
3. Extend `render.mjs` to splice the rendered sections into the placeholder and write the result through to `dist/index.html` (before minification).
4. Update `npm run build` to: `node scripts/build/render.mjs --inline → html-minifier-terser → cp public/`.
5. Commit a golden snapshot under `content/.golden/index.html` and add `npm run render:check` to CI.

Until then, `npm run build` is unchanged and uses the inline cards in `index.html`. The renderer is additive.

## Things this script must never do

- Reach the network.
- Mutate `content/**` (the renderer is read-only over the source of truth).
- Generate or "improve" definitions — that is the offline authoring pipeline's job (see [../authoring/](../authoring/)), and it must run separately, with human review.
- Inject IDs, timestamps, or random ordering — determinism is load-bearing for the snapshot test.
