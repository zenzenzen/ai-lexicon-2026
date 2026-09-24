# scripts/authoring

Offline agentic content pipeline. Drafts canonical definitions, role overlays, scenarios, and applicable artifacts from seed JSON; emits draft JSON for human review. **Not** part of `npm run build`.

> Why this layer exists: [../../.runbooks/intent.md](../../.runbooks/intent.md). Vocabulary: [../../.runbooks/ubiquitous_language.md](../../.runbooks/ubiquitous_language.md). Phased context: [../../PLAN.md](../../PLAN.md).

Status: **placeholder**. Scripts land in Phase 3, not Phase 1.

## Planned shape

```
scripts/authoring/
  extract.mjs          # verifies canonical definitions vs. recent sources, flags drift
  draft-overlay.mjs    # per-persona overlay drafting (Opus 4.7 with prompt caching)
  critique.mjs         # cheap critic pass (Haiku 4.5) that challenges accuracy
  review-stage.mjs     # writes drafts to content/cards/*.json under confidence: "draft"
```

## Hard rules

- Drafts must land with `confidence: "draft"` and a populated `generated_by`. They never auto-promote to `reviewed` or `verified`.
- `reviewed_by` and `reviewed_at` are only ever set by a human Reviewer.
- No script in this directory may run during `npm run build` or in CI's default path.
- Every prompt that talks to a model goes through prompt caching for the persona system prompt + the canonical definition; new content goes after the cache breakpoint.
