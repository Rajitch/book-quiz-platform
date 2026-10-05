#!/usr/bin/env node
/**
 * Question Bank Technical Quality Gate
 *
 * Usage:
 *   node tools/validate-questions.mjs data
 *   node tools/validate-questions.mjs data/science/chapter-03-visual.json
 *
 * This is a deterministic technical validator. It does NOT replace
 * source/content review against textbook screenshots; use the
 * QUESTION-BANK-QUALITY-GATE.md prompt for that.
 */
import fs from "node:fs";
import path from "node:path";

const target = process.argv[2] || "data";
const files = [];

function walk(p) {
  const s = fs.statSync(p);
  if (s.isDirectory()) {
    for (const f of fs.readdirSync(p)) walk(path.join(p, f));
  } else if (p.endsWith(".json") && !p.endsWith("books.json")) {
    files.push(p);
  }
}

walk(target);

const ALLOWED_TAGS = new Set([
  "svg","g","path","circle","ellipse","line","polyline","polygon","rect",
  "text","tspan","title","desc","defs","marker","linearGradient","radialGradient","stop"
]);
const ALLOWED_ATTRS = new Set([
  "xmlns","viewBox","width","height","role","aria-label","fill","fill-opacity",
  "stroke","stroke-width","stroke-linecap","stroke-linejoin","stroke-dasharray",
  "stroke-dashoffset","stroke-opacity","opacity","x","y","x1","y1","x2","y2",
  "cx","cy","r","rx","ry","points","d","transform","text-anchor",
  "dominant-baseline","font-family","font-size","font-weight","letter-spacing",
  "marker-start","marker-mid","marker-end","offset","stop-color","stop-opacity",
  "gradientUnits","gradientTransform","spreadMethod","refX","refY","markerWidth",
  "markerHeight","orient","id"
]);
const MAX_SVG_CHARS = 120000;

let errors = 0;
let warnings = 0;

function fail(msg) { console.error(`FAIL ${msg}`); errors++; }
function warn(msg) { console.warn(`WARN ${msg}`); warnings++; }

function checkSVG(svg, location) {
  if (typeof svg !== "string" || !svg.trim()) { fail(`${location}: SVG is empty`); return; }
  if (svg.length > MAX_SVG_CHARS) fail(`${location}: SVG exceeds ${MAX_SVG_CHARS} characters`);
  if (!/^\s*<svg\b/i.test(svg)) fail(`${location}: SVG must start with an <svg> root`);
  if (/<\s*(script|iframe|object|embed|foreignObject)\b/i.test(svg)) fail(`${location}: disallowed active/embedded SVG element`);
  if (/\bon[a-z]+\s*=\s*/i.test(svg)) fail(`${location}: inline SVG event handler detected`);
  if (/\\b(?:href|xlink:href)\\s*=\\s*["']\\s*(?!#)/i.test(svg)) fail(`${location}: external SVG href detected`);
  if (/url\s*\(\s*(?!#)[^)]+\)/i.test(svg)) fail(`${location}: external url() reference detected`);

  const tags = [...svg.matchAll(/<\s*([a-zA-Z][\w:-]*)\b/g)].map(m => m[1].toLowerCase());
  for (const tag of tags) {
    if (!ALLOWED_TAGS.has(tag)) fail(`${location}: unsupported SVG element <${tag}>`);
  }
  const attrs = [...svg.matchAll(/\\s([a-zA-Z_:][\\w:.-]*)\\s*=\\s*["'][^"']*["']/g)].map(m => m[1]);
  for (const attr of attrs) {
    if (!ALLOWED_ATTRS.has(attr)) fail(`${location}: unsupported SVG attribute ${attr}`);
  }
  if (!/<\/svg\s*>\s*$/i.test(svg)) warn(`${location}: SVG does not end with a clean </svg>`);
}

function validateVisual(v, location) {
  if (v == null) return;
  if (typeof v !== "object") { fail(`${location}: visual must be an object or null`); return; }
  if (v.type !== "svg") fail(`${location}: visual.type must be "svg"`);
  if (typeof v.svg !== "string") fail(`${location}: visual.svg must be a string`);
  else checkSVG(v.svg, location);
  if (typeof v.alt !== "string" || !v.alt.trim()) warn(`${location}: missing accessible alt text`);
}

for (const file of files) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    fail(`${file}: invalid JSON`);
    continue;
  }

  if (!Array.isArray(data.questions) || !data.questions.length) {
    fail(`${file}: no questions[]`);
    continue;
  }

  const ids = new Set();
  let v1 = 0, v2 = 0;

  data.questions.forEach((q, i) => {
    const p = `${file} Q${i + 1}`;
    const isLegacy = Array.isArray(q.options) && q.options.every(o => typeof o === "string");

    if (isLegacy) {
      v1++;
      for (const field of ["id","question","options","answer","explanation"]) {
        if (!(field in q)) fail(`${p}: missing ${field}`);
      }
      if (ids.has(q.id)) fail(`${p}: duplicate id ${q.id}`);
      ids.add(q.id);
      if (!Array.isArray(q.options) || q.options.length < 2) fail(`${p}: at least 2 options required`);
      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= (q.options?.length || 0)) fail(`${p}: invalid answer index`);
      if (new Set(q.options || []).size !== (q.options || []).length) warn(`${p}: duplicate options`);
      if ((q.explanation || "").trim().length < 10) warn(`${p}: short explanation`);
      if (!q.source) warn(`${p}: missing source reference`);
      if (!["easy","medium","hard"].includes(q.difficulty)) warn(`${p}: difficulty should be easy/medium/hard`);
      validateVisual(q.questionVisual, `${p} questionVisual`);
      return;
    }

    v2++;
    for (const field of ["id","question","options","correctOptionId","explanation"]) {
      if (!(field in q)) fail(`${p}: missing ${field}`);
    }
    if (ids.has(q.id)) fail(`${p}: duplicate id ${q.id}`);
    ids.add(q.id);

    if (!Array.isArray(q.options) || q.options.length < 2) {
      fail(`${p}: at least 2 structured options required`);
      return;
    }

    const optionIds = new Set();
    q.options.forEach((o, oi) => {
      const op = `${p} option ${oi + 1}`;
      if (!o || typeof o !== "object") { fail(`${op}: option must be an object`); return; }
      if (!o.id) fail(`${op}: missing option id`);
      if (optionIds.has(o.id)) fail(`${op}: duplicate option id ${o.id}`);
      optionIds.add(o.id);
      if (typeof o.text !== "string") fail(`${op}: text must be a string`);
      if (o.visual != null) validateVisual(o.visual, `${op} visual`);
    });

    if (!optionIds.has(q.correctOptionId)) fail(`${p}: correctOptionId does not match an option id`);
    if (q.visualRequired && !q.questionVisual && !q.options.some(o => o.visual)) {
      fail(`${p}: visualRequired=true but no visual is supplied`);
    }
    if (q.questionVisual) validateVisual(q.questionVisual, `${p} questionVisual`);
    if ((q.explanation || "").trim().length < 10) warn(`${p}: short explanation`);
    if (!q.source) warn(`${p}: missing source reference`);
    if (!["easy","medium","hard"].includes(q.difficulty)) warn(`${p}: difficulty should be easy/medium/hard`);

    const texts = q.options.map(o => (o.text || "").trim()).filter(Boolean);
    if (new Set(texts).size !== texts.length) warn(`${p}: duplicate option text`);
  });

  console.log(`${file}: ${data.questions.length} questions checked (legacy v1: ${v1}, visual-capable v2: ${v2})`);
}

console.log(`\nTechnical validation complete. Errors: ${errors}. Warnings: ${warnings}.`);
if (errors) {
  console.log("RESULT: NOT READY FOR PUBLICATION");
} else if (warnings) {
  console.log("RESULT: TECHNICALLY VALID WITH WARNINGS");
} else {
  console.log("RESULT: TECHNICALLY VALID");
}
process.exitCode = errors ? 1 : 0;
