#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const schemaPath = path.join(root, "content/schema/card.schema.json");
const cardPath = path.join(root, "content/cards/llm.json");

export function loadGate() {
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  const card = JSON.parse(fs.readFileSync(cardPath, "utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
  addFormats(ajv);
  return { card, validate: ajv.compile(schema) };
}

export function evaluateOverlay({ card, validate, persona, overlay }) {
  const candidate = structuredClone(card);
  candidate.role_overlays = { ...(candidate.role_overlays ?? {}), [persona]: overlay };
  const schemaValid = validate(candidate);
  const reviewMetadataPresent =
    typeof overlay.reviewed_by === "string" &&
    overlay.reviewed_by.trim().length > 0 &&
    typeof overlay.reviewed_at === "string";
  return {
    schemaValid,
    schemaErrors: schemaValid ? [] : structuredClone(validate.errors ?? []),
    reviewMetadataPresent,
    humanReview: "unverified",
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { card, validate } = loadGate();
  const schemaValid = validate(card);
  process.stdout.write(
    `${JSON.stringify({ card: "content/cards/llm.json", schemaValid, humanReview: "unverified" })}\n`,
  );
  process.exitCode = schemaValid ? 0 : 1;
}
