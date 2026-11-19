# Move format from asset to file — Design

Status: Approved
Approval: Approved by @volodymyr-h on 2026-11-05, including the requester's edits of that date. Revised on 2026-11-12 as instructed by @volodymyr-h: extension mapping, format override flag and migration rules (task T-11). Follow-up on 2026-11-13: optional `formatCode` on existing-file updates.
Requirements: ./requirements.md

## Existing implementation

- **Database** (`libs/persistence/prisma/schema.prisma`): `Asset.assetFormatItemCode` (`asset.asset_format_item_code TEXT NOT NULL`, FK `asset_asset_format_item_code_fkey`) is the only format reference. `File` has no format. `File.type` (`normal`/`legal`) is set from `legalDocItemCode` on upload. The application classifies files as legal by `legalDocCode !== null` (`workflow.ts`, `asset-editor-files.component.ts`, `asset-search-detail.component.ts`).
- **Shared contract** (`libs/shared/v2`): `Asset.formatCode` / `AssetData.formatCode` (`models/asset.ts`, `schemas/asset.schema.ts`), `AssetSearchResultItem.formatCode` (`models/search/asset-search-result.ts`, `schemas/search/asset-search-result.schema.ts`). `AssetFile`, `CreateAssetFileData` and `UpdateAssetFileData` (`models/asset-file.ts`, `schemas/asset-file.schema.ts`) carry no format. `workflow.ts` lists `'formatCode'` in the General category; NormalFiles deep-compares `files.filter(legalDocCode === null)`.
- **Backend** (`apps/server-asset-sg/src/features/assets`):
  - `prisma-asset.ts` selects/parses/writes `assetFormatItemCode`; file updates run through `files.updateMany` in `mapAssetDataToPrismaUpdate`.
  - `files/prisma-file.ts` maps files; `files/file.repo.ts#create` stores uploads; `files/file.service.ts#create` uploads to S3 and re-registers the asset in search; `files/files.controller.ts#upload` parses multipart `legalDocCode`.
  - `asset.service.ts#validateData` returns 422 for invalid references; `assets.controller.ts#update` and `files.controller.ts#upload` authorize via asset policies.
  - Search: `search/asset-search-writer.service.ts` and `search/file-search-writer.service.ts` (`write` selects `asset.assetFormatItemCode`; `writeAssetFiles` uses `asset.formatCode`) serialize `AssetSearchResultItem` into the `data` JSON blob; Elasticsearch mappings contain no format field. `SearchWriterService.register` reloads the asset and rewrites both indices; `POST /api/assets/sync` rebuilds them.
  - Export: `export/asset-export-metadata.ts` defines `format` as a single `Text` value (`localizeCode(asset.formatCode, …)`); `TextList` values are joined with `MULTI_VALUE_SEPARATOR` in CSV and GeoPackage.
- **sync-asset-sg**: `export-to-view.service.ts` selects `assetFormatItemCode` for published assets and copies full file rows (`exportFiles`); `sync-extern.service.ts` copies full file rows (`files: true`). Destination databases are reset and migrated with the same Prisma migrations.
- **Frontend**:
  - Overview `libs/asset-viewer/.../asset-search-results`: Type column shows one line per type plus `div.format` with `asset.formatCode | reference: "assetFormats"`.
  - Detail `asset-search-detail`: standalone Format card (`data-testid="assetFormat"`); both document lists use `asset-sg-asset-viewer-files`, which renders name and size tags.
  - Editor `libs/asset-editor`: General tab format dropdown (`asset-editor-general`), required `general.formatCode` form control (`asset-editor-page.component.ts`). Files tab (`asset-editor-files`) shows Name, legal-only Type, Status and actions. New files are added as pending entries by `file-drop-zone` and uploaded after the asset is saved (`AssetEditorService.uploadFilesForAsset`).

## Approach

1. **One shared format module** in `libs/shared/v2` provides the extension mapping (R-03), the canonical order and `getAssetFormatCodes(files)` (R-02). Backend and frontend use it, so upload assignment, pending-file preselection and derived formats cannot diverge.
2. **File owns the format** (R-01): `file.asset_format_item_code TEXT NOT NULL` with a foreign key to `asset_format_item`, plus the internal flag `file.is_format_overridden BOOLEAN NOT NULL` (no default). The asset column is dropped in the same migration (R-05).
3. **Derived, read-only asset formats** (R-02, R-11): `Asset.formatCode` is replaced by `Asset.formatCodes: LocalizedItemCode[]`, computed from the mapped files in `prisma-asset.ts`. It is excluded from `AssetData`, so it can never be written. `AssetSearchResultItem.formatCodes` replaces `formatCode`. Search, export, workflow and frontend consume this field or `AssetFile.formatCode`.
4. **Legal classification** uses `legalDocCode !== null` (`legal_doc_item_code IS NOT NULL` in SQL), matching existing runtime behavior. An INT consistency query returned zero mismatches between this classification and `file.type` on 2026-11-05. No data correction is needed.
5. **Assignment on upload** (R-03, R-09): the client preselects the extension-based format for pending files as a suggestion. It sends multipart `formatCode` only when the user changed it from the suggestion. The backend stores a submitted code after validating it and sets `isFormatOverridden = true`; when absent, it derives the format from the uploaded filename and sets `false`.
6. **Overrides** (R-04): `UpdateAssetFileData.formatCode` is optional. When it is omitted, the stored format and flag are untouched, so a stale editor cannot overwrite a newer format. When present, the file update compares it with the persisted value on the server and writes the format together with `isFormatOverridden = true` only when it differs; an unchanged format keeps its flag. Asset update validates all submitted codes and returns 422 for unknown codes before writing. Authorization is the existing asset update/upload policy. Legal files submit their stored format unchanged; no backend restriction is added for them. The flag is internal: it is not part of `AssetFile` or any API payload.
7. **Workflow** (R-12): `'formatCode'` is removed from General. Because `AssetFile.formatCode` is part of each file object, the existing NormalFiles deep comparison detects format changes. Derived `formatCodes` is not added to any category.

## Changes by area

### Shared models and API (`libs/shared/v2`)

- New `models/asset-format.ts`, exported from the barrel:
  - `ASSET_FORMAT_EXTENSIONS`: an ordered mapping from format code to extensions, as in R-03 (13 formats; `.xml` is not mapped).
  - `getFormatCodeForFileName(name: string): LocalizedItemCode`: takes the text after the last `.`, lower-cased. It returns `other` if there is no dot, the extension is empty, or the extension is unknown.
  - `compareAssetFormatCodes(a, b)`: canonical order, i.e. mapping order, then other codes alphabetically, with `other` last.
  - `getAssetFormatCodes(files: Pick<AssetFile, 'formatCode' | 'legalDocCode'>[]): LocalizedItemCode[]`: returns the distinct codes of non-legal files, sorted canonically.
- `AssetFile.formatCode: LocalizedItemCode` (DB `asset_format_item_code`). `CreateAssetFileData.formatCode: LocalizedItemCode`. `UpdateAssetFileData.formatCode?: LocalizedItemCode` (omitted = preserve format and flag). Matching `@IsString() @IsNotEmpty()` fields in `AssetFileSchema` / `UpdateAssetFileDataSchema`; in the update schema they only apply when the value is not `undefined` (`@ValidateIf`), so `null` and `''` are still rejected.
- `Asset.formatCode` is replaced by `formatCodes: LocalizedItemCode[]`, documented as derived. `AssetData` additionally omits `formatCodes`. `AssetSchema.formatCodes` is a string array; `formatCode` is removed from `AssetDataSchema`.
- `AssetSearchResultItem.formatCodes: LocalizedItemCode[]` replaces `formatCode`. The schema transforms a missing value to `[]`, so documents indexed before the migration still deserialize until the index is rebuilt.
- `workflow.ts`: remove `'formatCode'` from General.
- Fixtures and specs: `fixtures/asset.fixtures.ts` (file formats and derived asset formats), `schemas/asset.schema.spec.ts`, `models/workflow.spec.ts`.

### Prisma and database (`libs/persistence`)

- `schema.prisma`:
  - Remove `Asset.assetFormatItemCode` and its relation.
  - Add `File.assetFormatItemCode String @map("asset_format_item_code")` with `assetFormatItem AssetFormatItem @relation(...)`.
  - Add `File.isFormatOverridden Boolean @map("is_format_overridden")`, without a default, so every create path must set it.
  - `AssetFormatItem` back-relation changes from assets to `files File[]`.
- New migration `prisma/migrations/20261105120000_move_format_to_file/migration.sql`, wrapped in `BEGIN`/`COMMIT`:
  1. Insert the codelist entries `spreadsheet` and `presentation` (code, `No-GeolCode-specified`, de/fr/it/en names and descriptions) into `asset_format_item` with `ON CONFLICT DO NOTHING`.
  2. `ALTER TABLE file ADD COLUMN asset_format_item_code TEXT, ADD COLUMN is_format_overridden BOOLEAN`.
  3. CTE `file_extension_format`: each file's extension-based format, using `lower(substring(file_name from '\.([^.]+)$'))` with a `CASE` that reproduces the R-03 mapping; otherwise `other`. `file_name` keeps the original extension (see `determineUniqueFilename`).
  4. CTE `asset_format_stats`: per asset, from non-legal files only (`legal_doc_item_code IS NULL`), `has_match` (some extension-based format equals the asset format) and `distinct_formats` (count of distinct format codes, including `other`).
  5. CTE `file_format_assignment` decides `keeps_asset_format` per file, in the order of R-05: legal file → `false`; asset format `other` → `false`; `has_match` → `false`; `distinct_formats > 1` → `false`; otherwise `true`. No asset IDs are used.
  6. One `UPDATE` sets `asset_format_item_code` (the asset format if `keeps_asset_format`, else the extension-based format) and `is_format_overridden = keeps_asset_format` together. Assets without non-legal files therefore contribute nothing (R-05).
  7. `SET NOT NULL` on both columns, then add FK `file_asset_format_item_code_fkey` → `asset_format_item(asset_format_item_code)`, `ON DELETE RESTRICT ON UPDATE CASCADE`.
  8. Drop `asset_asset_format_item_code_fkey` and `asset.asset_format_item_code`.
- New `src/migrations/move-format-to-file.migration.spec.ts`, following `multiple-asset-kinds.migration.spec.ts`. It seeds assets and files on a scratch database, asserts each file's `[format, isFormatOverridden]`, and covers:
  - the `other` asset format;
  - a match through one of several non-legal files;
  - an exception (inherited format, flag `true`);
  - mixed extensions, including the new ones (`.SGY`, `.pptx`, `.xlsx`);
  - `.xml` falling back to `other`, and a `GISFormat` asset whose only file is `.xml` keeping `GISFormat` with flag `true`;
  - uppercase extensions and missing extensions;
  - an asset with only legal files;
  - a legal file on an excepted asset (extension-based, flag `false`);
  - a match through a legal file only: an asset with old format `pdf`, a normal `data.csv` and a legal `consent.pdf`. The normal CSV must inherit `pdf`, because the legal PDF must not trigger the extension-matching branch. The legal PDF independently receives `pdf` from its extension;
  - an asset with several distinct detected formats (`binary` with `.csv` and `.xlsx`) getting `db` and `spreadsheet`, flag `false`;
  - an asset with several files of one detected format (`binary` with `.xls`, `.xlsx` and a legal PDF) keeping `binary`, flag `true`, while the legal PDF gets `pdf`, flag `false`;
  - the new codelist entries;
  - NOT NULL without default for both columns, and FK enforcement;
  - removal of the asset column.
- Fix `multiple-asset-kinds.migration.spec.ts`: copy only migrations whose directory name sorts before its own, instead of “all except its own”. Otherwise the new migration is deployed before its seed writes `asset.asset_format_item_code`. Apply the same rule in the new spec.

### NestJS backend (`apps/server-asset-sg`)

- `prisma-asset.ts`:
  - Remove `assetFormatItemCode` from the selection, parse and create/update mapping.
  - Compute `formatCodes: getAssetFormatCodes(files)` when parsing.
  - The file `updateMany` writes one entry per submitted file that updates `legalDocItemCode` and `pageRangeClassifications`. If the file carries a `formatCode`, a second entry matches `assetFormatItemCode: { not: file.formatCode }` and sets `assetFormatItemCode` and `isFormatOverridden: true` together. It runs inside `AssetRepo.update`'s transaction, so the comparison is against the persisted value.
- `files/prisma-file.ts`: select and map `assetFormatItemCode` → `formatCode`. `isFormatOverridden` is not mapped.
- `files/file.repo.ts`:
  - `CreateFileData.formatCode?: LocalizedItemCode`.
  - `create` stores `data.formatCode ?? getFormatCodeForFileName(data.name)`, using the uploaded name rather than the uniquified one, sets `isFormatOverridden: data.formatCode != null`, and returns the format.
- `files/file.service.ts`: `UploadFileData` passes the optional `formatCode` through. If it is provided and unknown in `asset_format_item`, throw 422 before writing to the DB or S3 (R-01).
- `files/files.controller.ts#upload`: read optional multipart `formatCode` (string, empty treated as absent).
- `asset.service.ts#update`: validate the distinct submitted `data.files[].formatCode` values against `asset_format_item` and throw 422 for unknown codes before `assetRepo.update`. Omitted values are skipped; `null` and empty values are rejected with 400 by the request schema.
- `search/asset-search-writer.service.ts` and `file-search-writer.service.ts#writeAssetFiles`: write `formatCodes: asset.formatCodes`.
- `file-search-writer.service.ts#write`: select the asset's files (`legalDocItemCode`, `assetFormatItemCode`) instead of `asset.assetFormatItemCode` and use `getAssetFormatCodes`.
- `export/asset-export-metadata.ts`: the `format` column becomes `TextList`, resolved as `localizeCodes(asset.formatCodes, references.formats)`. An empty list yields an empty CSV cell and NULL in GeoPackage (R-10). No change to the reference-label loading.
- Fakes, fixtures and specs:
  - `asset.fake.ts`, `files/file.fake.ts`, `asset.repo.spec.ts`, `files/file.repo.spec.ts`, `asset.service.spec.ts`;
  - Upload service or endpoint tests:
    - a supplied valid format is stored unchanged with flag `true`, including when it equals or differs from the extension-based format;
    - an omitted format is derived from the uploaded filename with flag `false` (including `.xml` → `other`);
    - an unknown format returns 422 before any DB or S3 write;
  - `asset.repo.spec.ts`: editing a file's format sets the flag; a change back to the extension-based format still sets it; an unrelated save keeps the flags; a rejected update leaves the flag unchanged.
  - Repository tests separately verify persistence and database FK enforcement.
  - `search/asset-search.service.spec.ts`, `search/file-search-writer.service.spec.ts`;
  - `export/asset-export.test-utils.ts` and the export specs; test files set the flag explicitly, as do `test/file-fixtures.ts` (option, default `false`);
  - `commands/fixtures-create.command.ts`: passes the fixture file's `formatCode` only when it differs from the format detected from the uploaded name, so fixtures get the same flag as a real upload.

### sync-asset-sg

- `export-to-view.service.ts`: remove `assetFormatItemCode` from `PublishedAssetSelection` and the asset `select`. Files keep being copied as complete rows, so their stored formats and override flags are published. `AssetFormatItem` is already exported before files, which satisfies the new FK (R-13).
- `sync-extern.service.ts`: no logic change, because the full file rows include the new columns. `sync-extern.service.spec.ts` asserts that a file's stored (overridden) format and its flag are preserved.
- `export-to-view.service.spec.ts`: update the asset fixture and assert that files keep their format and flag and no asset-level format is selected or written.

### Angular and NgRx

- **Overview** (`asset-search-results`, R-06):
  - The format line renders the localized `asset.formatCodes` joined with `, `.
  - It is omitted when the list is empty.
  - The line is clamped to two lines via CSS line-clamp and has a `matTooltip` containing the full list.
  - Localization uses the existing reference data: a small component helper or pipe built on the store's `assetFormats`, since the `reference` pipe handles single codes.
- **Detail view** (R-07):
  - Remove the Format card from `asset-search-detail.component.html`.
  - `asset-viewer-files` gets an input `showFormat` (default `false`). When enabled, it renders `<asset-sg-asset-viewer-files-tag data-testid="file-format">` with `formatCode | reference: "assetFormats"` before the size tag.
  - Only the Documents list sets it.
- **General tab** (R-08): remove the dropdown and `assetFormats$` from `asset-editor-general`; remove `general.formatCode` from the form, `initializeForm` and `setupSaveBehaviour`.
- **Files tab** (R-09):
  - `asset-editor-files` gets a `formatCode` column between Name and Status, shown only when not in the legal tab.
  - Its `asset-sg-select` uses `selectReferenceAssetFormats`, i.e. all codelist entries, including `spreadsheet`, `presentation` and the manual-only `binary`, `seismic`, `textAnalog`, `unknown`. `updateFormatCode` mirrors `updateLegalDocItemCode` and marks the form dirty.
  - `ExistingAssetFile` includes `formatCode`.
  - `file-drop-zone` sets `formatCode: getFormatCodeForFileName(file.name)` on pending files.
  - `setupSaveBehaviour` sends `formatCode` for a created file, and for an updated file only when the final selection differs from the format loaded with the asset (`this.asset()`, refreshed after each save). It is omitted when untouched or changed back. `uploadFilesForAsset` appends it to the multipart body only when it differs from `getFormatCodeForFileName(file.name)`, so an untouched suggestion is detected on the server.
  - After upload, the merged asset recomputes `formatCodes` with `getAssetFormatCodes`.
- **i18n** (`apps/client-asset-sg/src/app/i18n/{de,en,fr,it}.ts`): reuse `search.format` for the Files tab column header. Remove `edit.tabs.general.format` if it becomes unused.
- **Specs**:
  - `asset-search-results.component.spec.ts`: format line, empty list, joined text, tooltip.
  - `asset-search-detail.component.spec.ts`: no Format card; tags only in Documents.
  - `asset-editor-page.kinds.spec.ts`: remove `formatCode`.
  - New or extended Files tab tests: dropdown only for normal files, preselection, update payload.

## Verification design

| Requirement | Automated verification                                                                                                                                                                                                                                                                                                                                                                                                              | Manual verification                                                                                                                                    |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R-01        | Migration spec: NOT NULL, FK, asset column gone. Repository tests: FK enforcement. Upload service or endpoint test: unknown code → 422 before any DB or S3 write. `asset.service.spec`: unknown file format → 422, asset unchanged.                                                                                                                                                                                                 | Upload with invalid `formatCode` returns 422.                                                                                                          |
| R-02        | `shared/v2` unit tests for `getAssetFormatCodes`: distinct, canonical order, legal excluded, empty. `asset.repo.spec` checks derived `formatCodes`.                                                                                                                                                                                                                                                                                 | —                                                                                                                                                      |
| R-03        | Unit tests for every mapped extension, uppercase, multiple dots, no extension, trailing dot, unknown and `.xml` → `other`. Upload service or endpoint tests: omitted format is derived with flag `false`; a supplied valid override is stored unchanged with flag `true`. `file.repo.spec`: fallback uses the uploaded filename. Files tab spec: an untouched suggestion is omitted from the upload request, a changed one is sent. | Upload `.PDF`, `.shp`, `.csv`, `.xml`, `.foo` files.                                                                                                   |
| R-04        | `asset.repo.spec`: an override persists through update and reload and sets the flag; an unrelated update keeps format and flag; a stale title-only save with omitted formats keeps a newer format and its flag. Editor spec: unchanged formats omitted, a changed one sent. Existing policy tests cover authorization.                                                                                                              | Override, save, reload; edit the title and confirm the format is unchanged. A non-editor PUT is rejected.                                              |
| R-05        | `move-format-to-file.migration.spec.ts` scenarios listed above, asserting format and flag, including a match through a legal file only, mixed-format assets and a single-format asset with a legal file. Dry run on the local pre-migration PROD snapshot.                                                                                                                                                                          | Run on an INT copy; review the distribution of exceptional assets. Legal classification consistency was checked on INT on 2026-11-05: zero mismatches. |
| R-06        | Results component spec.                                                                                                                                                                                                                                                                                                                                                                                                             | Long lists are clamped with an ellipsis and tooltip; assets without non-legal files show no format line.                                               |
| R-07        | Detail component spec.                                                                                                                                                                                                                                                                                                                                                                                                              | Compare with mockups.                                                                                                                                  |
| R-08        | Editor spec: no `formatCode` control; save payload without format.                                                                                                                                                                                                                                                                                                                                                                  | Create a new asset without format.                                                                                                                     |
| R-09        | Files tab spec.                                                                                                                                                                                                                                                                                                                                                                                                                     | Drop files, change a pending file's format, save, reload. The legal tab has no dropdown.                                                               |
| R-10        | Export metadata, CSV and GeoPackage specs: joined localized list; empty cell/NULL.                                                                                                                                                                                                                                                                                                                                                  | Export CSV and GeoPackage.                                                                                                                             |
| R-11        | Search writer and search service specs: `formatCodes` in `data`; a missing value deserializes to `[]`.                                                                                                                                                                                                                                                                                                                              | Change a format and verify the overview after save; run the index rebuild.                                                                             |
| R-12        | Workflow spec: a file format change marks NormalFiles, not General.                                                                                                                                                                                                                                                                                                                                                                 | —                                                                                                                                                      |
| R-13        | `export-to-view.service.spec.ts`, `sync-extern.service.spec.ts`: stored format and flag are copied.                                                                                                                                                                                                                                                                                                                                 | Run export-to-view and sync-extern locally.                                                                                                            |

Commands (from `package.json` / `project.json`):

- Targeted: `npx nx test shared/v2`, `npx nx test persistence` (requires the `.env.test` database), `npx nx test server-asset-sg`, `npx nx test sync-asset-sg`, `npx nx test asset-viewer`, `npx nx test asset-editor`.
- Final: `npm run lint`, `npm run build`, `npm run test`.
- Schema consistency: `npm run prisma -- migrate dev` on a local database reports no pending schema changes after applying the migration.

## Decisions, risks and open questions

- **Upload contract:** the upload endpoint accepts an optional `formatCode`. The client sends it only for a format the user changed from the suggestion, so the server can tell an explicit override (flag `true`) from detection (flag `false`). If omitted, the server derives the format from the filename.
- **Override flag:** it records whether a stored format was set explicitly, which cannot be reconstructed from the format and filename later. It is determined only on the server, kept internal, and copied by sync. A UI for it and a remapping job for non-overridden files are out of scope.
- **Editing the migration in place:** `20261105120000_move_format_to_file` exists only on the feature branch (not on `develop` or `main`). DEV deploys from `develop`, INT and PROD from `main`, so no shared environment has applied it and no forward migration is needed. Local databases that applied an earlier version of this migration must be reset (`prisma migrate reset`), because its checksum changed.
- **Legal classification:** the migration and the app use `legal_doc_item_code IS NOT NULL`. An INT query comparing this classification with `file.type` returned zero mismatches on 2026-11-05.
- **Search index rebuild after deployment:** existing `data` blobs lack `formatCodes`. The schema defaults to `[]` so the overview does not break, but formats are missing until `POST /api/assets/sync` runs. The rebuild is a required deployment step.
- **Legal-file formats are not protected on the backend:** no legal-specific restriction is added. An otherwise authorized request can change them. They remain invisible and do not affect asset formats.
- **API contract break:** `formatCode` is removed from asset and search payloads. All consumers in this repository are updated. VIEW consumers lose the asset-level column and must derive formats from files.
- **Migration on production-like data:** correctness depends on real filenames. Verification of the migration on an INT copy remains a manual, pending check.
- **Intermediate build state:** T-02 to T-09 change shared contracts and the schema. The workspace builds fully only after T-09; the tasks are delivered on one branch and must not be merged or deployed as incomplete intermediate states.

Open questions: None.

## Ordered tasks

- [x] T-01 — Add the shared format module (extension mapping, canonical order, `getAssetFormatCodes`) with unit tests (R-02, R-03)
- [x] T-02 — Update the Prisma schema, add the `move_format_to_file` migration and its migration spec, including the legal-only matching case, and fix the migration selection in `multiple-asset-kinds.migration.spec.ts` (R-01, R-05)
- [x] T-03 — Update the shared contracts (file `formatCode`, derived `Asset.formatCodes`, search result `formatCodes`, workflow category) and backend asset/file persistence (upload assignment, override persistence, 422 validation), with fakes, fixtures, repo/service specs and upload service or endpoint tests (R-01, R-02, R-03, R-04, R-08, R-11, R-12)
- [x] T-04 — Write derived formats in the asset and file search writers, with a defensive deserialization default and specs (R-02, R-11)
- [x] T-05 — Export the derived, localized formats in CSV and GeoPackage, with specs (R-02, R-10)
- [x] T-06 — Update the sync-asset-sg export-to-view selection and add sync and publication specs for file formats (R-13)
- [x] T-07 — Show the derived format list in the overview table (comma-separated, two-line clamp, tooltip), with specs (R-06)
- [x] T-08 — Remove the Format card and add per-file format tags to the Documents list in the detail view, with specs (R-07)
- [x] T-09 — Remove the General-tab format, add the Files-tab format dropdown with pending-file preselection and upload/update payloads, update i18n, with specs (R-04, R-08, R-09)
- [x] T-11 — Apply the revised mapping (incl. `.xml` → `other`, new `spreadsheet`/`presentation` entries), add the server-determined `isFormatOverridden` flag on create, update and sync, revise the migration rules (mixed-format detection, flag backfill), with specs and a snapshot dry run (R-01, R-03, R-04, R-05, R-09, R-13). Added on 2026-11-12, after T-09; T-10 runs last.
- [ ] T-10 — Run the full lint, build and test suites; complete the local manual scenarios; record the INT migration check and the required post-deployment index rebuild as pending (R-01–R-13)

## Implementation and verification results

Implementation: In progress (T-01–T-09 and T-11 done; T-10 pending)
Verification: In progress (T-01–T-09 and T-11 verified; server and persistence specs pass through `nx test` with `--testTimeout=60000`)

T-01 (2026-11-05):

- Added `libs/shared/v2/src/lib/models/asset-format.ts` (`ASSET_FORMAT_EXTENSIONS`, `OTHER_ASSET_FORMAT_CODE`, `getFormatCodeForFileName`, `compareAssetFormatCodes`, `getAssetFormatCodes` with input type `AssetFormatSource`), exported from `libs/shared/v2/src/index.ts`. `AssetFormatSource` is structurally compatible with `AssetFile` once T-03 adds `formatCode`.
- Added `asset-format.spec.ts`: every mapped extension, case-insensitivity, last extension only, missing/empty/unknown extensions, canonical order, distinctness, legal-file exclusion, empty result.
- `npx nx test shared/v2`: 5 suites, 85 tests passed. `npx nx lint shared/v2`: passed. `npx prettier --check libs/shared/v2/src`: passed. `tsc --noEmit -p libs/shared/v2/tsconfig.spec.json`: no errors apart from the pre-existing `TS6059` rootDir errors also reported for `tsconfig.lib.json`.

T-02 (2026-11-05):

- `schema.prisma`: moved `assetFormatItemCode`/`assetFormatItem` from `Asset` to `File` (required); `AssetFormatItem.files` replaces `assets`. Applied `prisma format`.
- Added migration `20261105120000_move_format_to_file` as specified. The extension mapping is a `CASE` over `lower(substring(file_name from '\.([^.]+)$'))` in a CTE, kept in sync with `ASSET_FORMAT_EXTENSIONS` by a comment.
- Added `move-format-to-file.migration.spec.ts`. It covers `other`, a match through one of several files, an exception including a legal file, mixed-format and single-format `binary` assets, upper-case, multi-dot, missing and trailing-dot names, an asset with only legal files, a match through a legal file only, an asset without files, asset column removal, NOT NULL, FK rejection of unknown codes and `ON DELETE RESTRICT`.
- `multiple-asset-kinds.migration.spec.ts` now deploys only the migration directories that sort before its own.
- Verification ran against the local test database (`development/docker-compose.test.yaml`, service `db`):
  - `npx nx test persistence`: 2 suites, 16 tests passed.
  - `npx nx lint persistence`: passed.
  - `npx prettier --check libs/persistence/src`: passed.
  - `tsc --noEmit -p libs/persistence/tsconfig.spec.json`: passed.
  - `prisma validate` and `prisma format --check`: passed.
  - `prisma migrate diff --from-migrations … --to-schema-datamodel … --exit-code`: no difference.
- The Prisma client has not been regenerated. Application code that still uses `asset.assetFormatItemCode` is updated in T-03 to T-06; until then the workspace build is expected to fail, as noted under "Intermediate build state".

T-03 (2026-11-05):

- Shared contracts:
  - `AssetFile.formatCode` is required in the model and `AssetFileSchema`, and optional in `CreateAssetFileData` and `UpdateAssetFileData` (omitted on update = preserve format and flag).
  - `Asset.formatCodes` is derived and omitted from `AssetData`; the asset-level `formatCode` is removed from `AssetDataSchema`, so strict validation rejects it.
  - `AssetSearchResultItem.formatCodes` defaults to `[]` for stale index documents.
  - `formatCode` is removed from the General workflow category, so file format changes count as normal files.
  - Fixtures derive file formats and `Asset.formatCodes`.
- Backend:
  - `prisma-asset.ts` derives `formatCodes` from the files and persists `file.formatCode` on update.
  - `prisma-file.ts` maps `formatCode`.
  - `FileRepo.create` stores a supplied format or derives one from the uploaded name.
  - `FileService.create` returns 422 for an unknown format before touching the database or S3.
  - The upload endpoint accepts an optional string `formatCode` and returns 400 for other types.
  - `AssetService.update` returns 422 for unknown file formats before writing.
  - Fakes and `fixtures-create.command.ts` pass file formats through.
- Tests:
  - `asset.schema.spec.ts` and `workflow.spec.ts` were extended.
  - `asset.repo.spec.ts` covers derivation, legal-only assets, override persistence across reload and unrelated edits, and FK rejection.
  - `file.repo.spec.ts` covers stored and derived formats, the uniquified name and an unknown format.
  - New `file.service.spec.ts` covers upload assignment and the 422 path.
  - `asset.service.spec.ts` covers the 422 path for updates.
- Verification:
  - `prisma generate` ran.
  - `npx nx test shared/v2`: 5 suites, 98 tests passed.
  - `npx nx run-many -t lint -p server-asset-sg shared/v2`: 0 errors. The 10 warnings are pre-existing and in files T-03 did not change.
  - `npx prettier --check`: passed for the changed TypeScript files.
  - `tsc --noEmit -p apps/server-asset-sg/tsconfig.spec.json`: only errors in search (`asset-search-writer.service.ts`, `file-search-writer.service.ts` and their specs, T-04) and export (`asset-export-metadata.ts`, `asset-export.test-utils.ts`, T-05).
- Server specs could not run through the regular `nx test` path:
  - Because of the T-04/T-05 type errors, ts-jest cannot compile specs that import the search writer.
  - In this environment, `setupDB` also exceeds the default 5 s hook timeout.
  - They were therefore run with Jest using a temporary config identical except for `diagnostics: false`, with `--testTimeout=60000`, against the local test database. The temporary config was removed.
  - `asset.repo`, `asset.service`, `file.repo` and `file.service` specs: 4 suites, 48 tests passed.
  - Full server suite: 13 suites passed. The 7 failing suites are search specs (Elasticsearch not running; T-04) and export/geometry-export specs (`asset-export.test-utils.ts` creates files without a format; T-05).
- Pending: the server specs must pass through the regular `nx test` once T-04 and T-05 are done.

T-04 (2026-11-06):

- `asset-search-writer.service.ts` and `file-search-writer.service.ts#writeAssetFiles` write `formatCodes: asset.formatCodes` into the `data` blob.
- `file-search-writer.service.ts#write` selects the asset's files (`assetFormatItemCode`, `legalDocItemCode`) instead of the removed asset column and writes `getAssetFormatCodes(...)`.
- The search queries have no format filter or aggregation and the Elasticsearch mappings have no format field, so neither needed a change.
- The deserialization default (`formatCodes` → `[]`) was added to `AssetSearchResultItemSchema` in T-03; T-04 adds its spec.
- Tests:
  - `asset-search.service.spec.ts`: expected items use `formatCodes`. New "file formats" tests cover:
    - distinct non-legal formats in canonical order, with the legal format excluded;
    - the reindexed list after a file's format changes;
    - `[]` for an asset with only legal files;
    - `[]` for a stale document that has the old `formatCode` but no `formatCodes`.
  - `file-search-writer.service.spec.ts`: the direct `prisma.file.create` sets a format. New tests check the derived non-legal formats in `data` for `write(fileId)` and for `writeAssetFiles(asset)`.
- Verification:
  - Run against the local test database and Elasticsearch (`development/docker-compose.test.yaml`, services `db` and `elasticsearch`).
  - `tsc --noEmit -p apps/server-asset-sg/tsconfig.spec.json`: only the export errors remain (`asset-export-metadata.ts`, `asset-export.test-utils.ts`, T-05).
  - Specs ran with the same temporary `diagnostics: false` config and `--testTimeout=60000` as in T-03; the config was removed afterwards. Search specs: 3 suites, 69 tests passed.
  - Full server suite: 15 suites passed. The 5 failing suites are the export and geometry-export specs, which depend on `asset-export.test-utils.ts` (T-05).
  - `npx nx lint server-asset-sg`: 0 errors, and the 10 warnings are the existing ones outside T-04 files.
  - `npx prettier --check` on the search folder: passed.
- Pending: the server specs must pass through the regular `nx test` once T-05 is done. Done in T-05, see below.

T-05 (export) results:

- `asset-export-metadata.ts`: the `format` column is now `TextList` and resolves `localizeCodes(asset.formatCodes, references.formats)`. An empty list exports as an empty CSV cell or a GeoPackage `NULL`. The GeoPackage column type stays `TEXT`.
- `asset-export.test-utils.ts`:
  - The asset-level formats were removed. The `full` asset's file has the overridden format `3D`, so its exported value stays "3D-spezifisches Format".
  - The `minimal` asset has no files, so its format is now empty.
  - A new `formats` asset has normal files with formats `db`, `pdf` and `pdf`, plus a legal `Contract` file with `textAnalog`.
- Tests:
  - Existing expectations were updated: metadata list values; empty CSV cell and GeoPackage `NULL` for `minimal`.
  - New metadata, CSV and GeoPackage tests check that the `formats` asset exports "PDF,Datenbank" (fr: "PDF,Base de données"): distinct values, canonical order, legal format excluded.
- Verification:
  - `tsc --noEmit -p apps/server-asset-sg/tsconfig.spec.json`: no errors.
  - Regular `npx nx test server-asset-sg --skip-nx-cache`: 17 of 20 suites passed. The 3 failures were `setupDB` hooks exceeding the 5 s default timeout in this environment (`asset-export.controller`, `asset-export-metadata.service`, `geometry-export.repo`); none failed an assertion.
  - The same command with `--testTimeout=60000`: 20 of 20 suites and 216 of 216 tests passed. No temporary config was used.
  - `npx nx lint server-asset-sg`: 0 errors, and the 10 warnings are the existing ones.
  - `npx prettier --check` on the changed export files: passed.
- Pending: the workspace build stays broken until the frontend tasks (through T-09) are done.

T-06 (sync-asset-sg) results:

- `export-to-view.service.ts`: `assetFormatItemCode` removed from `PublishedAssetSelection` and the asset `select`. Files are still copied as complete rows, so their stored formats are published.
- `sync-extern.service.ts`: no logic change. The file payload's `satisfies` check now uses `Prisma.FileUncheckedCreateWithoutAssetInput`, matching the method's declared return type. The checked input requires the new `assetFormatItem` relation instead of the scalar.
- Tests:
  - `export-to-view.service.spec.ts`: file fixtures carry `name` and `assetFormatItemCode`. A new test exports normal and legal files and checks that every stored format is copied, including an override (`scan.pdf` → `textAnalog`). The `exportAssets` test now also asserts that no asset-level format is selected or written.
  - `sync-extern.service.spec.ts`: a new test runs `synchronizeAsset` with the real file payload and checks that each file's stored format is copied, including an override and a legal file, without `id`/`assetId`, and that no asset-level format is written.
  - Fixed an existing compile error, with the user's approval: two `export-to-view.service.spec.ts` tests passed an undefined `config` as a third constructor argument. Since `HEAD`, this had stopped the whole suite from compiling.
- Verification:
  - `tsc --noEmit -p apps/sync-asset-sg/tsconfig.spec.json`: no errors.
  - `npx nx test sync-asset-sg --skip-nx-cache`: 2 of 2 suites, 46 of 46 tests passed.
  - `npx nx lint sync-asset-sg`: 0 errors and 88 warnings, all `no-explicit-any` (plus one non-null assertion) in the existing spec style.
  - `npx prettier --check apps/sync-asset-sg/src/core`: passed.
- Pending: manually running export-to-view and sync-extern locally (R-13), part of T-10.

T-07 (overview table) results:

- `asset-search-results.component.html`: the Type column keeps one `div.kind` line per type. It is followed by a single `div.format` line with the localized `formatCodes` joined by `, ` and a `matTooltip` showing the same full text. The line is omitted when the list is empty.
- `asset-search-results.component.scss`: `.format` is no longer a nowrap `line-list__item`; it wraps and is clamped to two lines (`line-clamp: 2`) with an ellipsis.
- `reference.pipe.ts` (`client-shared`): a new `assetFormats` overload accepts a list of codes, localizes each one, skips unknown codes, and joins them with `, `. This keeps the order of `formatCodes`, which is already canonical.
- Tests:
  - New `reference.pipe.spec.ts`: a single code, a localized list (fr), and unknown or empty lists.
  - `asset-search-results.component.spec.ts`: the joined list `PDF, Shapefile, SEG, LAS` after the type lines, the tooltip text via the real `MatTooltip`, and no format line for an empty list. Existing type-line tests use `formatCodes`.
  - `StubReferencePipe` mirrors the list behavior and now uses real format codes.
- Verification:
  - `npx nx test client-shared --skip-nx-cache`: 12 of 12 suites, 97 tests passed.
  - `npx nx test asset-viewer --skip-nx-cache`: 3 of 4 suites, 31 tests passed. `asset-search-detail.component.spec.ts` still doesn't compile because it uses the removed `formatCode` for the Format card; T-08 handles this.
  - `npx nx lint asset-viewer` and `client-shared`: 0 errors. The warnings are existing non-null assertions in untouched files.
  - Prettier on the changed files: passed.
- Pending: visual check of the two-line clamp and tooltip in the browser, part of T-10.

T-08 (detail view) results:

- `asset-search-detail.component.html`: the standalone Format card (`data-testid="assetFormat"`) is removed. Only the Documents list passes `[showFormat]="true"` to `asset-sg-asset-viewer-files`; the Legal documents list keeps the default.
- `asset-viewer-files`: new input `showFormat` (default `false`). When set, each file shows a `file-format` tag with `formatCode | reference: "assetFormats"` between the filename and the size tag. The size tag got `data-testid="file-size"`.
- Tests:
  - `asset-search-detail.component.spec.ts`: no Format card; the Documents list receives the normal files with `showFormat` set, the Legal documents list the legal files without it. The spec-local stub uses `@Input()`, because a signal `input()` in a spec file makes jest-preset-angular's JIT transform drop the `jest.mock` hoisting.
  - New `asset-viewer-files.component.spec.ts`: format tag before the size tag, the stored format (override) instead of one derived from the filename, and no tag by default. It uses the `native` rx-angular render strategy so `rxFor` renders synchronously.
- Verification:
  - `npx nx test asset-viewer --skip-nx-cache`: 5 of 5 suites, 38 tests passed.
  - `tsc --noEmit -p libs/asset-viewer/tsconfig.spec.json`: no errors.
  - `npx nx lint asset-viewer`: 0 errors; the 9 warnings are existing non-null assertions in untouched files.
  - Prettier on the changed folders: passed.
- Pending: visual comparison with `references/asset-detail-*.png`, part of T-10.

T-09 (editor) results:

- General tab: the format select, `assetFormats$`, the `general.formatCode` form control, its initialization and the asset-level `formatCode` in the save payload are removed. The unused i18n key `edit.tabs.general.format` is removed from de/en/fr/it.
- Files tab: new `formatCode` column (header `search.format`) between Name and Status. The normal tab shows it and hides `legalDocCode`; the legal tab shows `legalDocCode` and hides it. The select gets `[initialKeys]="[formatCode]"` (an array, because `SelectComponent` uses `includes`). `updateFormatCode` replaces the control value, moves an existing selection from the previous value to the new one (the previous value is captured before `setValue`, so checked rows stay checked and bulk actions apply to the new value), and marks the form dirty; selecting the current format is a no-op.
- Payloads: `ExistingAssetFile` includes `formatCode`. The drop zone preselects `getFormatCodeForFileName(name)` for every pending file, including legal documents. `filesToUpdate` and `filesToCreate` carry `formatCode`. The upload sends the multipart field `formatCode` (since T-11 only when changed from the suggestion). After upload, the merged asset recomputes `formatCodes` with `getAssetFormatCodes`.
- Tests:
  - `asset-editor-page.kinds.spec.ts` (new `file formats` block): no `general.formatCode` control or General-tab format select; the update payload has no asset-level `formatCode` and carries the overridden file format; new files are uploaded with their format and the saved asset's `formatCodes` include them.
  - New `asset-editor-files.component.spec.ts`: dropdown only in the normal tab; stored format preselected; a changed format is stored on that file only and marks the form dirty; a checked file stays selected after its format changes, and bulk deletion applies to the updated file (fails without the fix); reselecting the same format leaves the form unchanged; dropped files (normal and legal) get the extension-based format, case-insensitively; the upload request contains `formatCode`.
- Verification:
  - `npx nx test asset-editor --skip-nx-cache`: 3 of 3 suites, 23 tests passed (after the selection fix).
  - `tsc --noEmit -p libs/asset-editor/tsconfig.lib.json`: no errors. `tsc --noEmit -p libs/asset-editor/tsconfig.spec.json`: only the existing `map.component.ts(248)` `Timeout`/`number` error in an untouched asset-viewer file.
  - `npx nx lint asset-editor`: 0 errors; the 24 warnings are existing (`any` in the page-range-editor spec, non-null assertions in `asset-editor-files.component.ts` lines unchanged by this task).
  - Prettier on the changed files: passed after `--write`.
  - `npx nx build client-asset-sg --skip-nx-cache`: succeeded, so the frontend compiles again (including templates). Only the bundle-budget warning (3.47 MB vs 2.60 MB) was reported.
- Pending (T-10): manual check — drop files and verify the preselected formats, change a format, save and reload, verify it persists; confirm the legal tab has no format dropdown; visual comparison with `references/files-tab-format-dropdown.png` and `references/general-tab-remove-format-dropdown.png`.

T-11 (mapping, override flag, migration rules; 2026-11-12):

- Shared-environment check: the migration exists only on the feature branch (commit `9626b385`), not on `develop` or `main`, so it was edited in place; no forward migration is needed.
- Mapping: `ASSET_FORMAT_EXTENSIONS` follows R-03; `.xml` falls back to `other`. The migration `CASE` mirrors it.
- Code list: `spreadsheet` (de "Tabellenformat", fr "Format de tableur", it "Formato foglio di calcolo", en "Spreadsheet format") and `presentation` (de "Präsentationsformat", fr "Format de présentation", it "Formato di presentazione", en "Presentation format") are inserted by the migration and added to the test seed `test/data/asset-format-item.ts`. The translations need review.
- Persistence: `File.isFormatOverridden` in `schema.prisma`; the migration backfills format and flag as described above.
- Backend: `FileRepo.create` sets the flag; `prisma-asset.ts` sets format and flag together on an actual change; `fixtures-create.command.ts` passes only differing formats. Sync copies the flag through full rows without code changes.
- Frontend: `AssetEditorService.uploadFilesForAsset` omits an untouched suggested format.
- Tests (all assert format and flag):
  - `asset-format.spec.ts`: new extensions, `.xml`/`.XML` → `other`, `archive.pdf.zip` → `archive`, `archive.tar.gz` → `other`, canonical order.
  - `move-format-to-file.migration.spec.ts`: the scenarios listed under "Prisma and database".
  - `file.repo.spec.ts`, `file.service.spec.ts`: upload with an explicit override (also equal to the detected format) → `true`; without → `false`; `metadata.xml` → `other`/`false`.
  - `asset.repo.spec.ts`: format edit → `true`; change back to the detected format → `true`; unrelated save keeps `[true, false]`; rejected update keeps `false`.
  - `export-to-view.service.spec.ts`, `sync-extern.service.spec.ts`: the flag is copied.
  - `asset-editor-files.component.spec.ts`: dropped `archive.zip` → `archive`, `metadata.xml` → `other`; upload sends an override, omits an untouched suggestion, omits it for a legal file.
- Verification:
  - `npx nx test shared/v2 --skip-nx-cache`: 115 tests passed.
  - `npx nx test asset-editor --skip-nx-cache`: 25 tests passed.
  - `npx nx test sync-asset-sg --skip-nx-cache`: 46 tests passed.
  - `npx nx test persistence --skip-nx-cache --testTimeout=60000` (test DB stack): 21 tests passed.
  - `npx nx test server-asset-sg --skip-nx-cache --testTimeout=60000` (test DB and Elasticsearch): 219 tests passed, after resetting the local `postgres_test` database with `prisma migrate reset`, because it had applied the earlier version of the migration.
  - `npx nx run-many -t lint` on the five affected projects: 0 errors. Prettier on the changed files: passed. `prisma format`/`generate`: done.
- Snapshot dry run: the migration ran on the local pre-migration PROD snapshot (46,407 assets) inside `BEGIN … ROLLBACK`; the database was left unchanged.
  - The mixed-format rule (more than one distinct detected non-legal format, no asset IDs) detects exactly the 15 originally reviewed assets (44608, 75572, 75573, 75594, 76162, 76533, 76534, 76568, 76569, 76602, 76609, 76636, 76873, 76970, 76982) plus 74910: 16 assets. These IDs are verification data only; none of their files is flagged `true`.
  - Overridden files: 521 on 473 assets (the earlier ID-based version flagged 528 on 474). Legal files: 13,677, all flag `false`. All 21 `.xml` files → `other`/`false` (observed with the earlier version).
  - Largest preserved formats by extension: `GISFormat` on `.jpg` (255), `pdf` on `.tif` (144), `segy` on `.zip` (30), `binary` on `.xlsx` (25), `graphicVector` on `.pdf` (17). These may merit review.
- Pending: manual upload/edit checks and the INT migration check (T-10).

T-11 follow-up (mixed-format detection instead of asset IDs; 2026-11-13):

- The migration no longer lists asset IDs. Per asset, from non-legal files only, it computes whether any detected format equals the old asset format and the number of distinct detected format codes. Files get their detected format and flag `false` if they are legal, the old format is `other`, a match exists or more than one format was detected; otherwise they get the old format and flag `true`. Format and flag are written in one `UPDATE`.
- `move-format-to-file.migration.spec.ts`: the ID-specific tests are replaced by generated-ID cases (`binary` with `.csv` + `.xlsx` → `db`/`spreadsheet`, both `false`; `binary` with `.xls` + `.xlsx` + legal PDF → `binary`/`true` on both, legal PDF `pdf`/`false`). The former `exception` case now uses two PDFs, because mixed formats no longer inherit.
- `npx nx test persistence --skip-nx-cache` (test DB stack): 21 tests passed.
  T-11 follow-up (stale-editor format overwrite; 2026-11-13):

- `UpdateAssetFileData.formatCode` and its schema field are optional. An omitted value preserves the stored format and flag; other file metadata is still saved. A present value is validated against the codelist and, if it differs from the stored value, updates format and flag together.
- The editor compares each existing file's final selection with the format of the loaded asset and omits it when equal.
- Tests: `asset.repo.spec.ts` (stale title-only save keeps a newer format `graphicRaster` and its flag `true`; a `legalDocCode`-only save still persists), `asset.service.spec.ts` (only submitted formats are validated), `asset.schema.spec.ts` (missing accepted; `null`, empty and non-string rejected), `asset-editor-page.kinds.spec.ts` (unchanged and switched-back formats omitted, an intentional change sent).
- Verification:
  - `npx nx test asset-editor --skip-nx-cache`: 26 tests passed. `npx nx test shared/v2 --skip-nx-cache`: 116 tests passed.
  - `npx nx test server-asset-sg --skip-nx-cache` (test DB and Elasticsearch): 222 of 223 tests passed. The failure is `asset-search.service.spec.ts` › "writes assets to Elasticsearch", which exceeds its 15 s limit because Elasticsearch index operations were slow on this machine (1–6 s each, host stalls). Search code is unchanged in this follow-up; the test passed in earlier runs. It needs a re-run on a faster setup.

Pre-implementation data check (2026-11-05):

- Legal classification consistency checked on INT.
- Comparison of `file.type` with the presence of `legal_doc_item_code` returned zero mismatches.
- No data correction is required.
