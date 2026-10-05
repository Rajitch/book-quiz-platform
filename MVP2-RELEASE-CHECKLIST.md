# MVP-2 Release Checklist

## Content
- [ ] Every question supported by textbook screenshots
- [ ] Exactly one defensible answer
- [ ] Explanations verified
- [ ] Source/page verified
- [ ] No duplicates
- [ ] Difficulty reviewed

## Visuals
- [ ] Every SVG is valid
- [ ] No scripts/event handlers/external resources
- [ ] Visual matches question
- [ ] Visual matches option text
- [ ] Image-only options are understandable
- [ ] Alt text supplied
- [ ] No important information conveyed only by color
- [ ] Mobile rendering checked

## Technical
- [ ] `node tools/validate-questions.mjs data` passes
- [ ] No duplicate question IDs
- [ ] No duplicate option IDs within a question
- [ ] `correctOptionId` valid
- [ ] Local quiz works
- [ ] Review works
- [ ] Mistakes work
- [ ] PWA works
- [ ] Production deployment works

## Final gate

The Quality Gate must say:

`FINAL STATUS: READY FOR PUBLICATION`
