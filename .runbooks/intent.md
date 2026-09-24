# Intent — AI Lexicon

> **Purpose of this file:** the load-bearing alignment for everyone (and every agent) working on this project. If a change affects audience, scope, invariants, or product thesis, **update this file in the same PR** and add an entry to the Decision log.
>
> Tactical rollout details live in [../PLAN.md](../PLAN.md). Shared vocabulary lives in [./ubiquitous_language.md](./ubiquitous_language.md). This file is the *why* and the *promise*, not the *how*.

## North star

Help non-technical professionals (Marketing, Finance, Ops, …) and technical builders close the gap between **knowing AI vocabulary** and **applying it to their actual job today**. The tool succeeds when a user leaves with a portable artifact — a prompt, a workflow, a checklist, a guardrail — they actually paste into their own tools.

We are not building a glossary. We are building an applied-fluency engine that happens to use a glossary as its surface.

## Current product thesis (v0.1, 2026-05)

1. **Knowledge alone is empty.** A reader who can define RAG but doesn't know what to do with it on Tuesday is the failure mode the tool exists to prevent.
2. **Domain context decides relevance.** The same concept means different things to a marketer, a finance analyst, and an ops lead. Cards must carry **role-lens overlays** so the answer to "what is this for *me*?" is concrete.
3. **Application beats explanation.** Every overlay must produce at least one **applicable artifact** (prompt / checklist / decision aid / risk card / mini-spec) that the user can use unchanged or with minimal edits.
4. **Static at runtime, agentic at authoring.** The deployed site is a static artifact; AI generation happens offline, is human-reviewed, and committed as JSON. This protects accuracy, cost, privacy, and reproducibility.
5. **The poster aesthetic is a feature, not decoration.** The Risograph voice differentiates this from corporate training material. The frame stays loud; the artifacts can be sober.

## Audience (in priority order)

1. **Builder/Operator** — already served by v0; the technical spine.
2. **Marketing Practitioner** — Phase 3 launch persona.
3. **Finance / FP&A Analyst** — Phase 3 launch persona.
4. **Operations / PM / Generalist** — Phase 3 fast-follow.
5. *(later)* **Legal**, **HR**, **Sales**, **Healthcare admin**, **Education**.

A persona is "in" only when at least one curated path + a non-trivial set of role-lens overlays exists for it.

## Invariants (do not break without updating this file)

- **Single static artifact at runtime.** No backend, no hosted API, no live LLM calls in v1–v3. Phase 4 may introduce an explicitly opt-in BYO-key client-side feature; that is the only allowed exception, and it must be gated behind a visible toggle.
- **Deterministic build.** Same `content/**` + `index.html` template → byte-identical `dist/index.html`. CI enforces this.
- **JSON is the source of truth.** Cards are not edited in HTML once Phase 1 lands. The renderer is the only thing allowed to write card markup into the page.
- **Human-reviewed content.** Every overlay published to users carries a `reviewed_by` and `reviewed_at`. Drafts may live in JSON behind a `confidence: draft` flag but must not render to the public surface as if reviewed.
- **One PR per major task.** See [../CONTRIBUTING.md](../CONTRIBUTING.md). Each PR includes the intent/plan updates that justify it.

## Success signals

- A non-technical user copies an artifact and reports trying it on real work (qualitative; collected via the existing share/feedback channels — no telemetry added without revisiting this file).
- Number of cards with at least one **reviewed** overlay grows over time; ratio of `draft` to `reviewed` trends down.
- The site keeps loading instantly with no network beyond fonts and the static asset itself.

## Explicitly out of scope (today)

- Accounts, login, server-side persistence.
- Live LLM calls in the deployed site (except the opt-in Phase-4 BYO-key path, when/if shipped).
- User-generated decks or open submission.
- Mobile-app wrappers.
- Translation/i18n (future, but not now).

## Decision log

Format: `YYYY-MM-DD — short title — one-line summary — link`. Append-only. The latest decisions sit at the top.

- **2026-05-09 — Reframe as applied-fluency engine** — Pivot from "interactive study app" to "domain-aware applied-fluency engine"; add role-lens overlays and applicable artifacts; expand audience to non-technical roles. — [PLAN.md](../PLAN.md)
- **2026-05-09 — Phase 1 scaffolding kickoff** — Deck JSON + card schema + renderer skeleton landed; existing `npm run build` left untouched until extraction is complete. — [PLAN.md#phase-1--scaffolding-in-progress](../PLAN.md#phase-1--scaffolding-in-progress)

## Update rules for this file

Trigger an update whenever any of the following happen:

- The thesis or north star is challenged or refined.
- A new persona is added or an existing one dropped.
- An invariant is added, relaxed, or removed.
- A "do not do" boundary moves (e.g., we decide a backend is now in scope).
- A phase exit/entry is reached.

The update must include:

1. The body change explaining the new alignment.
2. A new entry at the top of the Decision log.
3. (When applicable) a corresponding edit to [../PLAN.md](../PLAN.md) and/or [./ubiquitous_language.md](./ubiquitous_language.md).
