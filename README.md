# Book Quiz Platform — MVP-2 Visual

A zero-backend, static educational quiz platform with:

- Book and chapter selection
- 10/20/30/40/50/all questions
- Practice and test modes
- Random question selection
- Random answer shuffling
- Text-only legacy question support
- Optional question SVGs
- Optional SVG answer choices
- Image + text answers
- Image-only answers
- SVG sanitization in the browser
- Technical question-bank validator
- Question Bank Quality Gate prompt
- Visual Question Generation prompt
- LocalStorage progress, mistakes, scores and theme
- PWA/offline support
- Cloudflare Pages / GitHub Pages compatible
- No backend, database, login or API required

## MVP-2 architecture

Textbook screenshots
→ Question + SVG generation
→ Question Bank Quality Gate
→ Technical validator
→ Chapter JSON
→ Book Quiz renderer
→ LocalStorage

## Important

The Quality Gate prompt validates textbook fidelity and visual correctness conceptually.
The Node validator validates JSON/schema/SVG safety deterministically.
Use BOTH before publishing generated content.

## Files

- `index.html` — application shell
- `css/style.css` — responsive UI
- `js/app.js` — quiz engine
- `js/svg.js` — SVG sanitizer/guard
- `data/books.json` — book/chapter catalogue
- `data/science/chapter-03-visual.json` — visual demo
- `tools/question-template.json` — legacy template
- `tools/question-template-v2.json` — visual-capable template
- `tools/validate-questions.mjs` — technical validator
- `VISUAL-QUESTION-GENERATION-PROMPT.md` — generation prompt
- `QUESTION-BANK-QUALITY-GATE.md` — final quality gate
- `MIGRATION-GUIDE.md` — v1 → v2 migration
- `DEPLOYMENT.md` — deployment instructions
- `_headers` — security/cache headers
- `sw.js` — PWA service worker

## Local test

From the project root:

```bash
python -m http.server 8000
```

Open:

`http://localhost:8000`

Do NOT open `index.html` directly with `file://`.

## Validate question banks

```bash
node tools/validate-questions.mjs data
```

A clean technical result should have zero errors.

## Adding a chapter

1. Put the JSON under `data/<book>/`.
2. Add a chapter entry in `data/books.json`.
3. Run the validator.
4. Test locally.
5. Commit and push.

No change to `app.js` is required.

## Existing question banks

Existing v1 question banks remain supported.

## Security

SVGs are not inserted as raw HTML. `js/svg.js` parses and sanitizes generated SVG before rendering.

## Optional GitHub validation

The project includes `.github/workflows/validate-questions.yml`. If GitHub Actions is enabled for the repository, every push/PR runs the deterministic question-bank validator automatically.
