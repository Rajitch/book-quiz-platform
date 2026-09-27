# Security notes

This application is intentionally static.

## Never place secrets in this repository

Do not add:

- API keys
- passwords
- access tokens
- service credentials
- private API endpoints

Everything under the public website should be considered public.

## Content safety

Question JSON is public application data.

Do not put private student information in it.

## Future backend

If a leaderboard or account system is added later:

- validate all incoming data server-side
- rate-limit write endpoints
- never trust browser-submitted scores
- use authentication for private data
- avoid storing unnecessary personal information
