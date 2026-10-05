# MVP-2 Migration Guide

## What changed

MVP-2 adds optional SVG visuals and structured answer options while preserving existing v1 text-only question banks.

### v1

```json
{
  "options": ["A", "B", "C", "D"],
  "answer": 0
}
```

### v2

```json
{
  "options": [
    {"id":"opt1","text":"A","visual":null},
    {"id":"opt2","text":"B","visual":null},
    {"id":"opt3","text":"C","visual":null},
    {"id":"opt4","text":"D","visual":null}
  ],
  "correctOptionId": "opt1"
}
```

## Do I need to convert existing chapters?

No.

The browser normalizes v1 questions automatically.

You can migrate chapters gradually.

## Recommended migration order

1. Leave existing chapters unchanged.
2. Generate new chapters using `tools/question-template-v2.json`.
3. Add optional `questionVisual`.
4. Add optional `options[].visual`.
5. Run the validator.
6. Run the content/visual Quality Gate.
7. Test the chapter in the browser.
8. Publish.

## Scoring

The application scores v2 using `correctOptionId`, not the displayed option position.

This means options can be shuffled without changing the correct answer.

## Embedded SVG recommendation

Keep SVG directly inside the chapter JSON for MVP-2.

Do not create a separate image directory unless a future question bank becomes large enough that JSON size becomes a practical problem.
