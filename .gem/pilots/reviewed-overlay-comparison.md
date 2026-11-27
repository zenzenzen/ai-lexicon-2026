# Reviewer metadata on the LLM card

## Task

Verify which reviewer fields are required for a role overlay on the LLM card when its status is draft, reviewed or verified, and check whether passing the schema establishes human approval.

The comparison used a clean candidate over `c22e9dfb8762`, the installed GEM 0.1.0 compiler and this project's existing ICM route configuration (`review` profile). Both received the objective above. The saved GEM request includes reviewed selectors. The plain GEM run used only the objective and the same 6,000-token budget. ICM used its default route for the objective after refreshing the copied inventory.

The first GEM request compiled on a clean checkout but delivered three of the four required sources. It omitted the LLM card. The reviewed request now includes the card and the executable regression gate.

## First retrieval

| Route | Files returned or listed | Required source bodies | Bytes | Bytes with missing sources added |
| --- | ---: | ---: | ---: | ---: |
| GEM, saved request | 6 files | 4/4 | 22,700 | 22,700 |
| GEM, plain objective | 4 files | 4/4 | 18,147 | 18,147 |
| ICM, listed read order | 9 files | 0/4 | 13,247 | 30,237 |

Required primary sources were `.runbooks/intent.md`, `CLAUDE.md`, `content/schema/card.schema.json`, `content/cards/llm.json`. GEM bytes measure its rendered Markdown packet. ICM bytes sum the files in its read order, including generated maps and inventories. Its handwritten cards alone total 1,703 bytes. A reader who already knows all required paths can open them directly for 16,990 bytes. A path mentioned in an inventory earns credit as a lead only. These sizes describe retrieval on this checkout, without model generation or timing.

The ICM domain card explains that a reader saving a card for review has no bearing on editorial approval. The route leaves the specific overlay fields, status conditions and tracked LLM example for the reader to open. Across its cards and generated files, ICM mentioned 4 of the 4 required paths. The plain GEM packet included `.runbooks/intent.md`, `CLAUDE.md`, `content/schema/card.schema.json`, `content/cards/llm.json`.

## Behavioral check

From a clean candidate, `npm ci`, `npm run test:reviewed-overlay`, `npm run validate:reviewed-overlay` and `npm run build` passed. All 12 checks used the tracked LLM card or an in-memory overlay on that card. Drafts can omit both review fields. Reviewed and verified overlays require `reviewed_by` and a calendar-valid `reviewed_at`. The schema accepts an empty reviewer string. The gate therefore reports human review as unverified even when validation passes. The card and schema were unchanged.

## Evidence freshness

Appending one newline to `content/schema/card.schema.json` in the disposable checkout caused the saved GEM request to block. ICM check reported stale generated data and passed after an ICM refresh. GEM still required review of the changed evidence. Restoring the original bytes returned both checks to green. The affected records were `document.card-schema`, `artifact.overlay-validator`, `gate.overlay-schema`, `task.prepare-reviewed-overlay`, `task.review-llm-overlay`.

## Repeat the comparison

Run from the project root with the GEM CLI installed. For the ICM arm, use a disposable checkout with a copy of this project's local `.icm/` and the ICM module on the Python path. This pilot used the local ICM configuration. Refreshing it regenerates the map and inventories, so their sizes vary with the checkout. The recorded run preceded this report.

```sh
project_id=ai-lexicon-2026
request=.gem/requests/reviewed-overlay.json
objective=$(node -p "require('./' + process.argv[1]).objective" "$request")
graph-engineering-magic --workspace . --workspace-id "$project_id" validate
graph-engineering-magic --workspace . --workspace-id "$project_id" context compile --request "$request" --markdown
graph-engineering-magic --workspace . --workspace-id "$project_id" context compile --task "$objective" --budget 6000 --markdown
python3 -m icm refresh .
python3 -m icm check .
python3 -m icm route . --task "$objective"
```
