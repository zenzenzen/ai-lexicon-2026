import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState, grade, queue, unlocked, progress, DAY, MINUTE } from "../scripts/curriculum/scheduler.mjs";
const t = 10 * DAY;
const path = { card_ids: ["a", "b", "c", "d"], nodes: {
  a: { prerequisite_ids: [], strand: "architecture" },
  b: { prerequisite_ids: [], strand: "systems" },
  c: { prerequisite_ids: ["a"], strand: "training" },
  d: { prerequisite_ids: ["c"], strand: "evaluation" },
} };
test("prerequisites gate and self-known sinks", () => {
  let s = initialState(); assert.deepEqual(queue(path, s, t).lockedIds, ["c", "d"]);
  s = grade(path, s, "a", "known", t); assert.equal(unlocked(path,s,"c"),true);
  assert.equal(progress(s,"a").streak,0); assert.equal(progress(s,"a").due,t+2*DAY);
  assert.equal(queue(path,s,t).laterIds.includes("a"),true);
  assert.throws(()=>grade(path,s,"a","correct",t));
});
test("two separated recalls master; failure resets and locks descendants", () => {
  let s=grade(path,initialState(),"a","correct",t);
  s=grade(path,s,"c","correct",t); assert.equal(unlocked(path,s,"d"),true);
  s=grade(path,s,"a","correct",t+DAY); assert.equal(progress(s,"a").status,"mastered");
  s=grade(path,s,"a","again",t+8*DAY); assert.equal(progress(s,"a").due,t+8*DAY+10*MINUTE);
  assert.equal(unlocked(path,s,"d"),false); assert.equal(progress(s,"a").streak,0);
});
test("review interleaves after two new cards",()=>{
  let s=grade(path,initialState(),"a","correct",t);
  s=grade(path,s,"b","known",t); assert.equal(queue(path,s,t+DAY).next,"a");
});
test("different strand when possible",()=>{
  let s=grade(path,initialState(),"a","known",t); assert.equal(queue(path,s,t).next,"b");
});
test("empty eligible queue and locked grading",()=>{
  let s=initialState();assert.throws(()=>grade(path,s,"d","known",t));
  s=grade(path,s,"a","again",t);s=grade(path,s,"b","again",t);assert.equal(queue(path,s,t).next,null);
});
