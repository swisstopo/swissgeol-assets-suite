---
description: "Draft requirements for review"
argument-hint: "<slug> [description]"
---

Input: $ARGUMENTS

1. Read repository instructions, `specs/README.md`, and the requirements template.
2. Read the feature description and inspect relevant existing code. Ask about missing decisions that affect requirements; do not invent behavior.
3. Create `specs/<NNN>-<slug>/requirements.md` using the number, provided to you as the command argument. If none is provided, use the next unused number, or update the explicitly selected draft. Do not overwrite another feature or change approved requirements without instruction.
4. Describe the problem, goal, user stories, scope, requirements with stable IDs and EARS acceptance criteria, and open questions. Set status to `In Review`, approval pending.
5. Report the file path and essential questions. Stop for review. Do not change application files or start design.
