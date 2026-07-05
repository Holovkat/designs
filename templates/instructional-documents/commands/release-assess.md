---
description: Assess release intent, confidence, change vectors, execution order, and specialist ownership before QA, production, cleanup, or closeout.
---

You are assessing a release or release-like change before moving it through
QA, production, cleanup, or closeout.

The canonical procedure lives in the `release-assess` skill. Read and follow
`skills/release-assess/SKILL.md` (in this project's `skills/` directory, or
the source at `templates/instructional-documents/skills/release-assess/SKILL.md`
in the designs repo).

**BEGIN NOW:** Load the skill, run the intent check, build the vector matrix
(`scripts/release-vector-assess.sh` when available), and return the ordered
execution plan with specialist rows and stop conditions.
