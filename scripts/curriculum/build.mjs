import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const course = resolve(root, "content/curricula/local-llm");
const read = file => readFileSync(file, "utf8");
const path = JSON.parse(read(resolve(course, "path.json")));
const cards = Object.fromEntries(path.card_ids.map(id => [id,
  JSON.parse(read(resolve(course, "cards", `${id}.json`)))]));
const source = read(resolve(root, "index.html"));
const styles = source.match(/<style>([\s\S]*?)<\/style>/)?.[1];
const fonts = source.match(/<link href="https:\/\/fonts\.googleapis\.com[^\n]+/);
if (!styles || !fonts) throw Error("Lexicon style source not found.");

const escape = str => str.replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);
const labels = {
  core: ["Core", "Core Concept"], arch: ["Arch", "Architecture"], ops: ["Ops", "Operations"],
  patterns: ["Patterns", "Pattern"], safety: ["Safety", "Safety"],
};
const normalize = text => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const oldTerms = [...source.matchAll(/class="card-term">([^<]+)</g)].map(match => normalize(match[1]));
if (oldTerms.length !== new Set(oldTerms).size) throw Error("Ambiguous legacy title.");
const additions = {};
for (const id of path.card_ids) {
  const card = cards[id];
  const legacy = path.nodes[id].legacy_inline_term;
  if (legacy) {
    if (!oldTerms.includes(normalize(legacy))) throw Error(`Missing legacy card: ${legacy}`);
    continue;
  }
  if (oldTerms.includes(normalize(card.term))) throw Error(`Duplicate card: ${card.term}`);
  const [label, back] = labels[card.category];
  (additions[card.category] ??= []).push({ card, label, back });
}
let home = source;
for (const [category, items] of Object.entries(additions)) {
  const grid = `<div class="grid" id="grid-${category}">`;
  const start = home.indexOf(grid);
  if (start < 0) throw Error(`Missing grid: ${category}`);
  const markup = items.sort((a,b) => a.card.index - b.card.index).map(({card, label, back}) => {
    const index = String(card.index).padStart(2, "0");
    const caption = `${label} · ${index}`;
    if (home.includes(`<span>${caption}</span>`)) throw Error(`Index used: ${caption}`);
    const term = escape(card.term);
    const abbr = card.abbreviation ? `<div class="card-abbr">${escape(card.abbreviation)}</div>` : "";
    return `  <div class="card cat-${category}"><div class="card-inner">
    <div class="card-face card-front"><div class="card-term">${term}</div>${abbr}<div class="card-cat"><span>${caption}</span><span class="card-flip-hint">tap →</span></div></div>
    <div class="card-face card-back"><div><div class="card-face-label">${term}</div><p class="card-def">${escape(card.canonical_definition)}</p></div><span class="card-back-cat">${back}</span></div>
  </div></div>`;
  }).join("\n\n");
  const nextSection = home.indexOf('<div class="section-heading', start + grid.length);
  const stop = home.lastIndexOf("</div>", nextSection < 0 ? undefined : nextSection);
  if (stop < start) throw Error(`Missing grid end: ${category}`);
  home = home.slice(0, stop) + markup + "\n\n" + home.slice(stop);
}
const total = oldTerms.length + Object.values(additions).reduce((n, group) => n + group.length, 0);
home = home.replace(/● \d+ Terms/, `● ${total} Terms`)
  .replace(/(id="count-display" aria-live="polite">)\d+ TERMS/, (_, start) => `${start}${total} TERMS`)
  .replace('<span class="chip">Study Guide Included</span>',
    '<span class="chip">Study Guide Included</span> <a class="chip yellow" href="/local-llm/">Local LLM Deep Dive</a>');

const data = JSON.stringify({ path, cards }).replace(/</g, "\\u003c");
const scheduler = read(resolve(here, "scheduler.mjs")).replace(/^export /gm, "");
const html = read(resolve(here, "study.template.html"))
  .replace("<!--__LEXICON_FONTS__-->", () => fonts[0])
  .replace("/*__LEXICON_STYLES__*/", () => styles)
  .replace("/*__DATA__*/", () => `const DATA = ${data};`)
  .replace("/*__SCHEDULER__*/", () => scheduler);
const out = resolve(root, "dist/local-llm");
mkdirSync(out, { recursive: true });
writeFileSync(resolve(root, "dist/index.html"), home);
writeFileSync(resolve(out, "index.html"), html);
for (const [source, target] of [
  ["labs/local-llm/benchmark.py", "benchmark.py"],
  ["docs/LOCAL_LLM_LABS.md", "labs.md"],
  ["docs/INKLING_READING_GUIDE.md", "reading-guide.md"],
]) copyFileSync(resolve(root, source), resolve(out, target));
console.log(`Built ${total} lexicon terms and ${path.card_ids.length} curriculum lessons`);
