import assert from "node:assert/strict";
import test from "node:test";

import { evaluateOverlay, loadGate } from "../scripts/authoring/reviewed-overlay-gate.mjs";

const gate = loadGate();

test("the actual tracked LLM card passes the base schema", () => {
  assert.equal(gate.card.id, "llm");
  assert.equal(gate.validate(gate.card), true, JSON.stringify(gate.validate.errors));
});

test("draft overlay may omit reviewer identity and date", () => {
  const result = evaluateOverlay({
    ...gate,
    persona: "marketing",
    overlay: { confidence: "draft" },
  });
  assert.equal(result.schemaValid, true);
  assert.equal(result.humanReview, "unverified");
});

for (const confidence of ["reviewed", "verified"]) {
  test(`${confidence} rejects missing reviewed_by`, () => {
    const result = evaluateOverlay({
      ...gate,
      persona: "marketing",
      overlay: { confidence, reviewed_at: "2026-11-27" },
    });
    assert.equal(result.schemaValid, false);
  });

  test(`${confidence} rejects missing reviewed_at`, () => {
    const result = evaluateOverlay({
      ...gate,
      persona: "marketing",
      overlay: { confidence, reviewed_by: "Human Reviewer" },
    });
    assert.equal(result.schemaValid, false);
  });

  test(`${confidence} rejects a non-calendar review date`, () => {
    const result = evaluateOverlay({
      ...gate,
      persona: "marketing",
      overlay: {
        confidence,
        reviewed_by: "Human Reviewer",
        reviewed_at: "2026-02-30",
      },
    });
    assert.equal(result.schemaValid, false);
  });

  test(`${confidence} accepts an empty reviewer string at the schema level`, () => {
    const result = evaluateOverlay({
      ...gate,
      persona: "marketing",
      overlay: { confidence, reviewed_by: "", reviewed_at: "2026-11-27" },
    });
    assert.equal(result.schemaValid, true);
    assert.equal(result.reviewMetadataPresent, false);
    assert.equal(result.humanReview, "unverified");
  });

  test(`${confidence} schema validity does not establish human approval`, () => {
    const overlay = {
      confidence,
      reviewed_by: "Human Reviewer",
      reviewed_at: "2026-11-27",
    };
    const schemaOnly = evaluateOverlay({ ...gate, persona: "marketing", overlay });
    assert.equal(schemaOnly.schemaValid, true);
    assert.equal(schemaOnly.reviewMetadataPresent, true);
    assert.equal(schemaOnly.humanReview, "unverified");
  });
}
