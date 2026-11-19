# Assets development instructions

## What this is

Assets is part of Swissgeol and supports managing, searching, viewing, and exporting geological asset data. The application uses an Angular frontend, a NestJS backend, Prisma with PostgreSQL, and shared TypeScript models.

Relevant integrations include NgRx, Jest, Elasticsearch, S3, and geospatial functionality. Read the relevant checkout files for the current architecture and versions; do not apply conventions from other Swissgeol applications automatically.

## Repository orientation

Before working on a feature, locate its backend, frontend, shared models, and tests. Read repository documentation, package scripts, project configuration, and existing neighboring implementations for actual paths and commands.

- Frontend: Angular components/services, NgRx state, translations, and shared UI libraries.
- Backend: NestJS modules, controllers, services, data access, and background processing.
- Persistence: Prisma schema/migrations and PostgreSQL queries.
- Feature specifications: `specs/`, with templates in `specs/templates/`.

Do not invent directory names, package-manager commands, project targets, or generated-client workflows.

## End-to-end feature workflow

1. Requirements: `/specify <slug>` drafts `requirements.md` with user stories and EARS acceptance criteria. Stop for approval.
2. Design: `/design` maps approved requirements onto the existing code and writes `design.md` with ordered implementation tasks. Stop for approval.
3. Implementation: `/implement` completes one authorized task and its tests, updates the checklist, and stops for review. Execute a larger batch only when explicitly instructed.

See `specs/README.md`. The user chooses each stage. Do not treat silence or a general acknowledgment as approval, or advance automatically after approval. Skip the workflow only when explicitly requested.

Make ordinary coding decisions within an authorized task. Ask before changing approved scope, behavior, architecture, dependencies, API contracts, or schema beyond the design. Present proposed revisions before changing approved documents or implementing the revision.

## Backend

- Follow existing NestJS module, controller, service, validation, authorization, and error-handling patterns.
- Keep business logic in the existing service layer rather than duplicating it in controllers.
- Follow the repository's Prisma and migration conventions. Include necessary schema and existing-data changes in the design.
- Preserve existing data-integrity guarantees when changing persistence or background processing.

## Frontend and shared models

- Follow existing Angular and NgRx conventions in the affected feature.
- Keep backend contracts, shared models, and frontend usage consistent, including nullability.
- Reuse existing services, components, translations, and generated artifacts where applicable.
- Enforce authorization on the backend; UI visibility alone does not establish access control.

## Code comments

- Keep comments short, usually one or two lines.
- Explain non-obvious reasons or constraints, not what the code already says.
- Do not add comments to every function or changed block.
- Do not add long JSDoc blocks unless requested. Put detailed feature explanations in the spec.

## Definition of done

- Relevant tests, lint, and builds pass using commands verified from the repository.
- Acceptance criteria are checked and their results recorded.
- Requirements and design reflect the agreed implementation.
- Relevant manual checks are completed or clearly marked pending.

Use Jest and existing test conventions where applicable. Add meaningful behavioral/regression tests; do not merely mirror implementation details. Report failures and unrun checks honestly. Keep implementation completion separate from pending environment checks.

## Git and communication

Preserve unrelated user changes and keep the diff focused. Do not commit, push, deploy, run remote jobs, or modify remote databases without explicit instruction. Keep explanations and completion reports concise: changes, verification, and remaining work.
