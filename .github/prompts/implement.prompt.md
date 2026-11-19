---
description: "Implement an approved task and stop for review"
agent: agent
---

Use the user's arguments and conversation as input.

1. Read repository instructions, `specs/README.md`, and the selected requirements and design. State the spec folder. Inspect any supporting material in the feature folder, including its`references/` subfolder, and use it according to `specs/README.md`.
2. Require explicit approval of the current requirements and design. If missing, stop and ask; invoking this command alone is not approval.
3. Select the requested task, or the next unchecked task by default. Implement only that task and its directly associated tests. A larger batch or the full design requires explicit user authorization.
4. Inspect the working tree and preserve unrelated changes. Follow existing conventions. Make ordinary coding choices within the task, but stop and ask before changing the approved approach or scope.
5. Run relevant checks. Report failures and unrun checks accurately; do not fix unrelated issues or weaken checks.
6. Check off finished tasks and record verification results in `design.md`. Leave unfinished tasks and unperformed checks pending. Do not rewrite the design to justify an unapproved deviation.
7. Give a concise report of changes, checks, and remaining work. Stop for review after the authorized task or batch. Do not commit, push, deploy, or modify remote databases without instruction.
