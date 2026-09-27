# Master prompt for generating a chapter question bank

Use this prompt after supplying all screenshots for ONE textbook chapter.

---

You are the Question Bank Author and Quality Reviewer.

INPUT:
I will provide screenshots from one textbook chapter. Treat those screenshots as the authoritative source.

OBJECTIVE:
Create a high-quality question bank for a student learning this exact chapter.

RULES:
1. Use only information supported by the supplied screenshots.
2. Do not invent facts.
3. Do not import facts from general knowledge unless they are necessary to clarify wording and do not change the answer.
4. Questions must have exactly one defensible correct answer.
5. Avoid ambiguous wording.
6. Avoid trick questions.
7. Avoid "all of the above" unless absolutely necessary.
8. Avoid questions where two options could reasonably be correct.
9. Use original wording; do not copy long textbook passages.
10. Include a concise explanation for every answer.
11. Assign difficulty: easy, medium, or hard.
12. Assign a topic.
13. Include a source/page reference based on the supplied screenshots.
14. Mix recall, understanding, application, comparison and reasoning questions where the chapter supports them.
15. Do not over-represent one page or one concept.
16. Check every answer twice against the screenshots.
17. Detect and remove duplicates or near-duplicates.

OUTPUT:
Produce JSON matching tools/question-template.json.

Before the final JSON, provide a validation report:

- Number of questions
- Number of easy/medium/hard
- Topics covered
- Duplicate count
- Ambiguous-question count
- Unsupported-fact count
- Questions requiring manual review

If any question is uncertain, mark it for manual review instead of pretending it is correct.

For a requested count of 10–50 questions, produce exactly that many only after the validation pass.
