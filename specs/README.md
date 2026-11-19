# Spec-Driven Development

This repo uses a lightweight, two-document spec workflow. Before writing production code, capture what and why (requirements), then how and the work (design + task breakdown). Each document is reviewed before the next step starts.

Use the workflow unless the user explicitly asks to skip it. Keep specs proportional to the change.

## The two documents

| File              | Question it answers                           | Owner of the review     |
| ----------------- | --------------------------------------------- | ----------------------- |
| `requirements.md` | What must be true, and why?                   | Product/requester + dev |
| `design.md`       | How will we build it, and what are the steps? | Dev + reviewer          |

The design carries the ordered task breakdown so the approach and work can be reviewed together.

```text
specs/
  templates/
    requirements.md
    design.md
  <NNN>-<feature-slug>/
    requirements.md
    design.md
```

Number folders chronologically, for example `specs/001-feature-name`. Copy the templates into a feature folder; do not edit the templates when specifying a feature.

## Supporting material

A feature folder may contain screenshots, diagrams, example files, or other
supporting material, optionally organized in a `references/` subfolder.

Read or inspect this material alongside `requirements.md` and `design.md`.
Use it as additional context for requirements, design, implementation, and
verification. Reference relevant filenames in the spec.

If material cannot be inspected or conflicts with the written requirements,
flag the issue and ask for clarification rather than guessing.

## Workflow

1. `/specify <slug> [description]` scaffolds the feature folder and drafts requirements with user stories and EARS acceptance criteria. Stop for requester/dev sign-off.
2. `/design [NNN-slug]` reads approved requirements and writes the design: the approach mapped onto the Assets backend, shared models, and Angular frontend, plus ordered tasks referencing requirement IDs. Name actual files, services, endpoints, and models where relevant. Stop for reviewer agreement.
3. `/implement [NNN-slug] [task ID]` implements an authorized checklist task and its tests, records results, then stops for review. A larger batch or the full checklist requires an explicit user instruction.

The user starts each stage separately. Explicit approval of the current requirements is needed before design, and of the current design before implementation. Silence, a general acknowledgment, or a status label alone is not approval. Record actual approval; do not request it again for unchanged approved content.

During specify and design, change only the feature's spec documents. During implementation, ordinary coding choices within the authorized task are allowed. Stop and propose a revision before changing agreed behavior, scope, architecture, dependencies, API contracts, or schema beyond the design. Update approved documents only after agreement on the revision.

If the folder argument is omitted, select the feature folder with the most recently modified requirements/design file, excluding templates. State the selected folder; ask if ambiguous.

You can also copy and fill in the documents manually in the same order. Keep both documents consistent with the agreed implementation.

## EARS acceptance criteria

Write acceptance criteria using EARS (Easy Approach to Requirements Syntax):

- Ubiquitous: `THE SYSTEM SHALL <response>`what
- Event-driven: `WHEN <trigger> THE SYSTEM SHALL <response>`
- State-driven: `WHILE <state> THE SYSTEM SHALL <response>`
- Unwanted behaviour: `IF <condition> THEN THE SYSTEM SHALL <response>`
- Optional feature: `WHERE <feature is included> THE SYSTEM SHALL <response>`

Example:

> WHEN a user requests an asset export, THE SYSTEM SHALL include only assets that user is authorized to access.

## Conventions for this repo

- Specs are cross-cutting: one feature folder covers backend, shared-model, and frontend changes.
- Reference actual NestJS controllers/services, Prisma models or queries, shared types, Angular components/services, NgRx state, and translation keys where relevant.
- State the required access rules in requirements and design when the feature changes data access or visibility.
- Use stable requirement IDs (`R-01`) and task IDs (`T-01`). Keep task checkboxes in `design.md`, not a separate implementation document.
- Use document statuses `Draft`, `In Review`, and `Approved` with an actual approval record.
- Link the spec folder from the PR description.

## Definition of done

- The authorized tasks are implemented and their relevant tests pass.
- Relevant build and lint checks pass using the repository's actual commands.
- Acceptance criteria have recorded verification results.
- The spec reflects the agreed implementation.
- Relevant manual checks are performed or explicitly listed as pending.

Record implementation completion separately from outstanding verification. Some environment-dependent checks may require INT; do not report them as verified locally. Do not commit, push, deploy, run remote jobs, or modify remote databases without explicit instruction.
