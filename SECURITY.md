# MVP-2 Security Notes

## SVG handling

Generated SVG is untrusted content.

The application does not directly inject generated SVG strings with `innerHTML`.

`js/svg.js` parses SVG and permits only a controlled subset of elements and attributes.

Blocked content includes:
- script
- iframe
- object
- embed
- foreignObject
- event handlers
- external hrefs
- external url() references

## Content Security Policy

The `_headers` file includes a restrictive baseline CSP appropriate for this static app.

## Source content

Only publish textbook-derived content you are authorized to publish.

The question bank should use original question wording and explanations rather than copying long textbook passages.
