# Deployment — exact procedure

## A. Create GitHub account/repository

Go to GitHub and create a new repository.

Suggested name:

book-quiz

If the content is private/proprietary, use a private repository. Cloudflare Pages can connect to GitHub repositories; confirm your current GitHub/Cloudflare account permissions during setup.

Upload the project files while preserving folders.

## B. First local test

Install Python or use another static server.

```bash
python -m http.server 8000
```

Then open:

http://localhost:8000

Test:

1. Book selector
2. Chapter selector
3. 10 questions
4. 20 questions
5. All questions
6. Practice mode
7. Test mode
8. Wrong answer
9. Correct answer
10. Result screen
11. Retry
12. Practice My Mistakes
13. Dark mode
14. Refresh
15. Browser offline after first successful load

## C. Validate

Install Node.js if you want to run the validator.

```bash
node tools/validate-questions.mjs data
```

Fix all errors before deployment.

Warnings should also be reviewed.

## D. Cloudflare

Use the Git integration rather than manual upload.

Current Cloudflare Pages documentation supports GitHub integration and automatic deployments from pushes. The Pages free plan currently documents 500 builds/month, up to 20,000 files per site, and a 25 MiB maximum individual asset. Static asset requests are currently free and unlimited.

Set:

Production branch = main

Framework = none/static HTML

Build command = empty

Output directory = repository root

## E. First production test

After deployment, open the generated `pages.dev` URL.

Test on:

- Android Chrome
- desktop Chrome/Edge/Firefox
- mobile portrait
- mobile landscape

Check browser console for errors.

## F. Release discipline

For a major version:

```bash
git add .
git commit -m "Release v1.1.0"
git tag v1.1.0
git push origin main --tags
```

Do not make unrelated changes in the same release commit.

## G. If production breaks

Revert the bad commit and push.

Cloudflare will redeploy the corrected main branch.

Cloudflare Pages also supports rollback of deployments.

## H. Free-tier discipline

Do not add:

- paid database
- paid CDN
- paid analytics
- paid AI API
- large videos
- unnecessary server functions

The core application does not need any of them.
