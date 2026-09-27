# Book Quiz — Free Long-Term Static Platform

A mobile-first chapter quiz application designed to run without a backend.

## Architecture

- Source control: GitHub
- Hosting: Cloudflare Pages
- Frontend: vanilla HTML/CSS/JavaScript
- Question storage: JSON
- Scores/mistakes/theme: browser localStorage
- Optional offline capability: service worker/PWA
- No database
- No login
- No API key
- No paid dependency

## 1. Local test

You need Node.js only for the question validator. For the website, use any local static server.

From the project directory:

```bash
python -m http.server 8000
```

Open:

http://localhost:8000

Do not open index.html directly with file:// because browsers block some fetch requests from local files.

## 2. Validate question banks

```bash
node tools/validate-questions.mjs data
```

A zero-error result is required before publishing.

## 3. Add a new chapter

Create:

```text
data/science/chapter-03.json
```

Use `tools/question-template.json`.

Then add the chapter to `data/books.json`:

```json
{
  "id": "science-ch03",
  "number": 3,
  "title": "Your Chapter",
  "description": "Short description",
  "file": "data/science/chapter-03.json"
}
```

The web app will discover it automatically after deployment.

## 4. Question rules

Every question must have:

- unique id
- question
- 2–5 options
- integer answer index
- explanation
- difficulty: easy / medium / hard
- topic
- source/page reference

Important: `answer` is zero-based:
- 0 = first option
- 1 = second option
- 2 = third option
- 3 = fourth option

## 5. Screenshot-to-question workflow

For each textbook chapter:

1. Capture clear, readable screenshots.
2. Keep page order.
3. Extract the chapter's actual facts and learning objectives.
4. Generate questions only from the supplied material.
5. Require one unambiguous correct answer.
6. Add an explanation.
7. Add source/page reference.
8. Assign difficulty.
9. Run the validator.
10. Manually spot-check every question.
11. Commit to GitHub.
12. Cloudflare Pages automatically deploys it.

Never publish questions merely because an AI generated them. Verify them against the textbook.

## 6. GitHub repository

Create a repository, for example:

book-quiz

Recommended branch:

main

Keep production-ready content on main.

For substantial changes:

```text
main
  └── feature/new-chapter
```

Test the feature branch locally, then merge it to main.

## 7. Cloudflare Pages deployment

1. Create/login to Cloudflare.
2. Open Workers & Pages / Pages.
3. Create a Pages project.
4. Select Git integration.
5. Connect GitHub.
6. Select the `book-quiz` repository.
7. Production branch: `main`.
8. Framework preset: None / static HTML.
9. Build command: leave empty.
10. Build output directory: `/` (the repository root).
11. Deploy.

The repository is then the source of truth.

Every push to main triggers a deployment.

## 8. Important deployment rule

Do NOT upload a second copy manually.

Use Git integration as the permanent deployment method.

This gives you:

Git commit
→ Cloudflare build
→ production deployment
→ rollback capability

## 9. Adding content later

The normal cycle is:

Screenshots
→ generate/verify questions
→ edit JSON
→ validate
→ commit
→ push
→ automatic deployment

No server restart is required.

## 10. What is stored locally

The application stores only:

- quiz attempt count
- quiz history
- best scores
- unanswered/wrong-question practice list
- theme preference

It does not create an account or send these items to a server.

Clearing browser site data resets local progress.

## 11. Future extensions

The current architecture intentionally leaves room for:

- shared leaderboard
- teacher/admin dashboard
- user accounts
- cloud synchronization
- question search
- timed exams
- certificates
- analytics
- Cloudflare D1 database
- Cloudflare Workers API

Do not add these until they are genuinely required.

## 12. Free-tier safety principles

To remain free:

- keep the public site static
- keep questions as JSON
- avoid server-side functions for normal gameplay
- do not call AI APIs from the browser
- compress large images
- avoid video hosting
- avoid uploading textbook screenshots to the public site unless you have rights to publish them

## 13. Content copyright

A textbook may be copyrighted. Questions written from learning material are not automatically free of copyright concerns, and reproducing textbook screenshots/pages can create additional rights issues.

For the public site, prefer original question wording and explanations. Do not publish full textbook pages unless you have permission or a clear legal basis.

## 14. Production checklist

Before launch:

[ ] All chapter JSON files validate
[ ] No duplicate question IDs
[ ] Every answer index is correct
[ ] Every question has an explanation
[ ] Every question has a source reference
[ ] Questions were checked against the supplied textbook
[ ] Mobile layout tested
[ ] Desktop layout tested
[ ] Offline/PWA tested
[ ] GitHub main branch contains production version
[ ] Cloudflare production deployment succeeds
[ ] Production URL tested on phone
[ ] Backup/rollback plan understood

## 15. Backup

GitHub is the primary source repository.

Create a release/tag for major milestones:

```text
v1.0.0
v1.1.0
v1.2.0
```

Never delete the repository as a substitute for maintenance.

## 16. Recovery

If a deployment breaks:

1. Identify the bad commit.
2. Revert it in GitHub.
3. Push to main.
4. Cloudflare deploys the previous working state.

Keep the last known-good release tag.

## 17. Recommended future data organization

```text
data/
  books.json
  science/
    chapter-01.json
    chapter-02.json
  mathematics/
    chapter-01.json
  english/
    chapter-01.json
```

Do not create one enormous JSON file for the entire application. One chapter per file keeps updates, debugging and validation manageable.

## 18. Why no framework?

This project deliberately uses vanilla JavaScript.

That means:

- no npm dependency required for the website
- no framework upgrades
- no build pipeline
- fewer security/update obligations
- faster deployment
- simple long-term maintenance

The validator uses Node.js, but the production website does not.

