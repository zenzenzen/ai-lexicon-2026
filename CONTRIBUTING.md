# Contributing

## Working Style

Prefer one pull request per major task, and prefer one focused commit per major step inside that PR.

Good examples:

- `Design: refine hero spacing and typography`
- `Accessibility: improve keyboard flip behavior`
- `Deploy: fix Vercel output directory`

Avoid mixing unrelated work in a single commit when it makes review harder.

## Commit Guidance

- Keep commit scopes narrow and reviewable.
- Use commit messages that explain the intent, not just the file touched.
- Separate visual changes, accessibility changes, content updates, and deployment changes when possible.

## PR Guidance

- Summarize the user-facing change first.
- Leave comments in the code where the visual or deploy behavior is non-obvious.
- Note any tradeoffs, especially where fidelity to the original design constrained the implementation.
- Include verification notes for search, filters, card flipping, and deployment behavior.

## Static Site Notes

- `index.html` is the source of truth for the artifact.
- `npm run build` creates the minified `dist/` output used for static deployment.
- `public/` contains favicon, OG image, and robots metadata that must ship alongside the built HTML.
