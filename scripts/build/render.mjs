#!/usr/bin/env node
// Prebuild renderer for the AI Lexicon deck.
// - Reads ../../content/deck.json + ../../content/cards/*.json
// - Emits HTML fragments matching the existing inlined card markup in index.html
// - Pure Node ESM, no dependencies, deterministic output (sorted file order).
// - Outputs to dist/render-preview.html during Phase 1 scaffolding.
//   Once extraction is complete, this renderer will splice into the page template
//   directly. See scripts/build/README.md for the cutover plan.

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");
const CARDS_DIR = join(ROOT, "content", "cards");
const DECK_FILE = join(ROOT, "content", "deck.json");
const OUT_DIR = join(ROOT, "dist");
const OUT_FILE = join(OUT_DIR, "render-preview.html");

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loadDeck() {
  return JSON.parse(readFileSync(DECK_FILE, "utf8"));
}

function loadCards() {
  const files = readdirSync(CARDS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();
  return files.map((f) => {
    const card = JSON.parse(readFileSync(join(CARDS_DIR, f), "utf8"));
    const expectedId = f.replace(/\.json$/, "");
    if (card.id !== expectedId) {
      throw new Error(`card id "${card.id}" does not match filename "${f}"`);
    }
    return card;
  });
}

function renderCard(card, cat) {
  const idx = String(card.index).padStart(2, "0");

  const frontParts = [`<div class="card-term">${escapeHtml(card.term)}</div>`];
  if (card.abbreviation) {
    frontParts.push(`<div class="card-abbr">${escapeHtml(card.abbreviation)}</div>`);
  }
  frontParts.push(
    `<div class="card-cat"><span>${escapeHtml(cat.short_label)} · ${idx}</span><span class="card-flip-hint">tap →</span></div>`,
  );
  const front = frontParts.join("");

  const backLabel = card.alternate_label || card.term;
  const back =
    `<div><div class="card-face-label">${escapeHtml(backLabel)}</div>` +
    `<p class="card-def">${escapeHtml(card.canonical_definition)}</p></div>` +
    `<span class="card-back-cat">${escapeHtml(cat.back_label)}</span>`;

  return (
    `  <div class="card cat-${cat.id}"><div class="card-inner">\n` +
    `    <div class="card-face card-front">${front}</div>\n` +
    `    <div class="card-face card-back">${back}</div>\n` +
    `  </div></div>`
  );
}

function renderSection(cat, cards) {
  const sectionCards = cards
    .filter((c) => c.category === cat.id)
    .sort((a, b) => a.index - b.index);

  if (sectionCards.length === 0) return "";

  const heading =
    `<div class="section-heading sh-${cat.id}" data-cat="cat-${cat.id}">\n` +
    `  <span class="sh-num">${escapeHtml(cat.section_number)}</span>\n` +
    `  <span class="sh-label">${escapeHtml(cat.label)}</span>\n` +
    `  <span class="sh-desc">${escapeHtml(cat.description)}</span>\n` +
    `</div>`;

  const cardHtml = sectionCards.map((c) => renderCard(c, cat)).join("\n\n");
  const grid = `<div class="grid" id="grid-${cat.id}">\n\n${cardHtml}\n\n</div>`;

  const bannerText = cat.banner_label || cat.short_label.toUpperCase();
  const banner = `<!-- ═══════════ ${bannerText} ═══════════ -->`;
  return `${banner}\n${heading}\n\n${grid}`;
}

function main() {
  const deck = loadDeck();
  const cards = loadCards();

  // Validate every card's category points at a known section.
  const knownCats = new Set(deck.categories.map((c) => c.id));
  for (const c of cards) {
    if (!knownCats.has(c.category)) {
      throw new Error(`card "${c.id}" has unknown category "${c.category}"`);
    }
  }

  const sections = deck.categories
    .map((cat) => renderSection(cat, cards))
    .filter(Boolean);

  const out = sections.join("\n\n\n") + "\n";

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, out, "utf8");

  const rendered = cards.length;
  const sectionCount = sections.length;
  console.log(
    `rendered ${rendered} card${rendered === 1 ? "" : "s"} across ${sectionCount} section${sectionCount === 1 ? "" : "s"} → ${OUT_FILE}`,
  );
}

main();
