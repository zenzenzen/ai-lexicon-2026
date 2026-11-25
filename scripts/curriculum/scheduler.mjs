// Pure scheduling functions. Caller supplies time; build contains no learner state.
export const DAY = 86_400_000;
export const MINUTE = 60_000;
const fresh = () => ({ status: "unseen", streak: 0, due: 0, last: 0 });
export const progress = (state, id) => state.cards[id] ?? fresh();
export const initialState = () => ({ version: 1, cards: {}, lastStrand: null, newRun: 0 });

export function unlocked(path, state, id) {
  // Existing passed prerequisites must also have a passed prerequisite chain.
  const passed = new Set();
  function visit(key) {
    if (passed.has(key)) return true;
    const status = progress(state, key).status;
    if (!["known", "mastered"].includes(status)) return false;
    if (!path.nodes[key].prerequisite_ids.every(visit)) return false;
    passed.add(key);
    return true;
  }
  return path.nodes[id].prerequisite_ids.every(visit);
}

export function queue(path, state, now) {
  const freshIds = [], dueIds = [], lockedIds = [], laterIds = [];
  for (const id of path.card_ids) {
    const item = progress(state, id);
    if (!unlocked(path, state, id)) { lockedIds.push(id); continue; }
    if (item.status === "unseen") freshIds.push(id);
    else if (item.due <= now) dueIds.push(id);
    else laterIds.push(id);
  }
  const diffStrand = (a, b) => Number(path.nodes[a].strand === state.lastStrand)
    - Number(path.nodes[b].strand === state.lastStrand);
  // Due misses come first within reviews; otherwise interleave strands and age.
  dueIds.sort((a, b) => Number(progress(state, b).status === "learning")
    - Number(progress(state, a).status === "learning")
    || diffStrand(a, b) || progress(state, a).due - progress(state, b).due);
  freshIds.sort(diffStrand);
  laterIds.sort((a, b) => progress(state, a).due - progress(state, b).due);
  // Two new cards then one due review when both pools are nonempty.
  const next = (state.newRun >= 2 ? dueIds[0] : freshIds[0])
    ?? dueIds[0] ?? freshIds[0] ?? null;
  return { next, freshIds, dueIds, lockedIds, laterIds };
}

export function grade(path, state, id, action, now) {
  if (!path.nodes[id] || !unlocked(path, state, id)) throw Error("Locked card");
  const prior = progress(state, id);
  if (prior.status !== "unseen" && prior.due > now) throw Error("Review not due");
  let next;
  switch (action) {
    case "known":
      if (!["unseen", "learning"].includes(prior.status)) throw Error("Already known");
      next = { status: "known", streak: 0, due: now + 2 * DAY, last: now };
      break;
    case "again":
      next = { status: "learning", streak: 0, due: now + 10 * MINUTE, last: now };
      break;
    case "correct": {
      const streak = prior.streak + 1;
      const interval = streak === 1 ? 1 : Math.min(60, 7 * 2 ** (streak - 2));
      next = { status: streak >= 2 ? "mastered" : "known", streak,
        due: now + interval * DAY, last: now };
      break;
    }
    default: throw Error("Unknown grade");
  }
  return { ...state, cards: { ...state.cards, [id]: next },
    lastStrand: path.nodes[id].strand,
    newRun: prior.status === "unseen" ? state.newRun + 1 : 0 };
}
