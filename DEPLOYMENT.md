# MVP-2 Deployment — Complete Procedure

## Recommended production setup

Use:

- GitHub repository for source
- Cloudflare Pages for static hosting
- no backend
- no database
- no runtime server

The application is static.

## STEP 1 — Test locally

Install Node.js if you want to run the validator.

From the project root:

```bash
python -m http.server 8000
```

Open:

```text
http://localhost:8000
```

Test:

1. Book dropdown
2. Chapter dropdown
3. Visual Questions Demo
4. Start Quiz
5. Question SVG
6. Image-based answers
7. Text + image answers
8. Correct answer highlighting
9. Wrong answer highlighting
10. Results review
11. Practice My Mistakes
12. Dark mode
13. Mobile layout

## STEP 2 — Run technical validation

```bash
node tools/validate-questions.mjs data
```

Expected final result:

```text
RESULT: TECHNICALLY VALID
```

Warnings should be reviewed before publication.

## STEP 3 — Run the Question Bank Quality Gate

Provide the following to the Quality Gate:

- textbook screenshots
- generated chapter JSON
- `tools/question-template-v2.json`

Run:

`QUESTION-BANK-QUALITY-GATE.md`

Do not publish while the final status is:

```text
NOT READY
```

## STEP 4 — Add a production chapter

Example:

```text
data/science/chapter-04.json
```

Add it to:

```text
data/books.json
```

Example:

```json
{
  "id": "science-ch04",
  "number": 4,
  "title": "Chapter 4",
  "description": "Chapter description.",
  "file": "data/science/chapter-04.json"
}
```

## STEP 5 — Validate again

```bash
node tools/validate-questions.mjs data
```

## STEP 6 — GitHub

Create a GitHub repository.

Upload the contents of this project, not the outer ZIP directory.

Typical Git commands:

```bash
git init
git add .
git commit -m "Initial Book Quiz Visual MVP"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY
git push -u origin main
```

## STEP 7 — Cloudflare Pages

In Cloudflare:

1. Open Pages.
2. Create a new Pages project.
3. Connect the GitHub repository.
4. Select the repository.
5. Framework preset: None / static HTML.
6. Build command: `exit 0`.
7. Build output directory: the repository root (`.`)
8. Deploy.

There is no Node build step for the website itself.

Node is only used locally for the question-bank validator.

## STEP 8 — Verify production

Open the assigned Cloudflare Pages URL.

Verify:

- `/`
- `data/books.json`
- visual chapter
- SVG question
- SVG answer
- mobile layout
- refresh
- PWA installation if supported

## STEP 9 — Test offline/PWA

After loading the site successfully:

1. Open it once while online.
2. Reload.
3. Test the previously loaded chapter.
4. Disconnect the network.
5. Confirm the cached application still works.

New chapters may not be available offline until their JSON has been fetched/cached.

## STEP 10 — Every future chapter

Use this exact workflow:

```text
Screenshots
    ↓
VISUAL-QUESTION-GENERATION-PROMPT.md
    ↓
Question JSON v2
    ↓
QUESTION-BANK-QUALITY-GATE.md
    ↓
Fix every FAIL/REVIEW
    ↓
node tools/validate-questions.mjs data
    ↓
Add JSON to data/
    ↓
Add chapter to books.json
    ↓
Local browser test
    ↓
git add .
    ↓
git commit
    ↓
git push
    ↓
Cloudflare Pages auto-deploy
```

## Rollback

If a deployment is bad:

- revert the Git commit
- push again
- Cloudflare Pages redeploys the reverted version

## Do not change

For adding ordinary chapters, do NOT modify:

- `js/app.js`
- `js/svg.js`
- `index.html`
- `css/style.css`

Only change the data files.

## When to consider separate SVG files

Keep embedded SVG for MVP-2.

Consider separate SVG assets only when chapter JSON files become unnecessarily large or browser load performance becomes an actual problem.
