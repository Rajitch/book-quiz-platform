#!/usr/bin/env node
/**
 * Run:
 *   node tools/validate-questions.mjs data/science/chapter-01.json
 * Or:
 *   node tools/validate-questions.mjs data/science
 */
import fs from "node:fs";
import path from "node:path";

const target = process.argv[2] || "data";
const files = [];
function walk(p) {
  const s = fs.statSync(p);
  if (s.isDirectory()) for (const f of fs.readdirSync(p)) walk(path.join(p,f));
  else if (p.endsWith(".json") && !p.endsWith("books.json")) files.push(p);
}
walk(target);

let errors=0, warnings=0;
for (const file of files) {
  let data;
  try { data=JSON.parse(fs.readFileSync(file,"utf8")); }
  catch(e){ console.error(`FAIL ${file}: invalid JSON`); errors++; continue; }
  if (!Array.isArray(data.questions) || !data.questions.length) {
    console.error(`FAIL ${file}: no questions[]`); errors++; continue;
  }
  const ids=new Set();
  data.questions.forEach((q,i)=>{
    const p=`${file} Q${i+1}`;
    for (const field of ["id","question","options","answer","explanation"]) {
      if (!(field in q)) { console.error(`FAIL ${p}: missing ${field}`); errors++; }
    }
    if (ids.has(q.id)) { console.error(`FAIL ${p}: duplicate id ${q.id}`); errors++; }
    ids.add(q.id);
    if (!Array.isArray(q.options) || q.options.length < 2) { console.error(`FAIL ${p}: at least 2 options required`); errors++; }
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= (q.options?.length || 0)) { console.error(`FAIL ${p}: invalid answer index`); errors++; }
    if (new Set(q.options || []).size !== (q.options || []).length) { console.warn(`WARN ${p}: duplicate options`); warnings++; }
    if ((q.explanation || "").trim().length < 10) { console.warn(`WARN ${p}: short explanation`); warnings++; }
    if (!q.source) { console.warn(`WARN ${p}: missing source reference`); warnings++; }
    if (!["easy","medium","hard"].includes(q.difficulty)) { console.warn(`WARN ${p}: difficulty should be easy/medium/hard`); warnings++; }
  });
  console.log(`${file}: ${data.questions.length} questions checked`);
}
console.log(`\nValidation complete. Errors: ${errors}. Warnings: ${warnings}.`);
process.exitCode = errors ? 1 : 0;
