---
description: "Draft a design from approved requirements"
argument-hint: "[NNN-slug]"
---

Input: $ARGUMENTS

1. Read repository instructions and `specs/README.md`. Resolve and state the spec folder.
2. Read `requirements.md`. Require explicit approval of its current content; if missing, stop and ask. Do not treat this command alone as approval.
3. Inspect relevant code, tests, and configuration to identify actual affected files and check commands.
4. Draft `design.md` using the template. Map the approach onto actual Assets backend, shared-model, and frontend components where relevant. Write ordered, reviewable tasks with IDs, requirement references, and associated tests. Identify dependency, schema, or API changes explicitly if needed. Include the relevant build, lint, automated tests, and manual verification in the verification design.
5. Set status to `In Review`, approval pending. Report key decisions and stop for review. Do not change application files or start implementation. Propose revisions before changing an already approved design.
