# Move format from asset to file — Requirements

Status: Approved
Approval: Approved by @volodymyr-h on 2026-11-05, including the requester's edits of that date. Revised on 2026-11-12 as instructed by @volodymyr-h: extension mapping, format override flag, and migration rules (R-01, R-03, R-04, R-05, R-09, R-13). Follow-up on 2026-11-13: omitted format on existing-file updates (R-04, R-09).

Feature: #1065

## Problem and goal

Format currently belongs to the asset (`asset.asset_format_item_code`), although it describes an individual file. An asset with a PDF report, a shapefile and a LAS log can only state one format, so the stored value is incomplete or misleading, and editors must maintain it manually.

The goal is to make format a required property of each file, assign it automatically from the filename extension on upload, allow editors to override it per file, and derive an asset's formats from its non-legal files. Existing data must be migrated without losing deliberate format exceptions.

## User stories

- As an editor, I want each uploaded file to receive a format automatically, so that I do not have to maintain formats manually.
- As an editor, I want to override a file's format, so that I can correct files whose extension does not reflect their content.
- As a user searching assets, I want to see all formats contained in an asset, so that I can judge whether its files are useful to me.
- As a user viewing an asset, I want to see each document's format beside its filename, so that I know what I will download.
- As a user exporting assets, I want exports to list the asset's file formats, so that the export matches the application.
- As an operator, I want existing asset formats migrated to files while preserving deliberate exceptions, so that curated data is not lost.

## Scope

Included:

- Persistence: move format from `asset` to `file` (`file.asset_format_item_code`, not null, foreign key to `asset_format_item`), add the format override flag (`file.is_format_overridden`, not null), and migrate the data.
- Code list: add the format entries Spreadsheet (`spreadsheet`) and Presentation (`presentation`).
- Backend: automatic assignment on upload, per-file format updates, derived asset formats in API responses, search indexing, CSV/GeoPackage export, workflow change tracking, and `sync-asset-sg` sync-extern and export-to-view.
- Shared models: file-level format and derived asset-level formats.
- Frontend: asset overview table, asset detail view, General editing tab and Files editing tab.

Excluded:

- A new search filter by format. No format filter exists today; this feature only ensures that indexed and returned asset data uses file-derived formats.
- Changes to the `asset_format_item` code list other than adding `spreadsheet` and `presentation`.
- Changes to document-content tags (page count, languages, page classifications) shown in the mockups.
- Editing or displaying legal-file formats.
- Displaying or editing the format override flag, and exposing it in the API.
- Re-deriving formats of existing files after the migration, other than on upload, including a remapping job for files without an override.

Definitions:

- **Legal file**: a file with `type = Legal` (a legal document code is set). All other files are **non-legal files**.
- **Asset formats**: the distinct formats of an asset's non-legal files.
- **Extension-based format**: the format assigned to a filename by the mapping in R-03.
- **Canonical format order**: the order of formats in the R-03 mapping table (`pdf`, `GISFormat`, `segy`, `las`, `db`, `textDigital`, `graphicRaster`, `graphicVector`, `multimedia`, `archive`, `spreadsheet`, `presentation`, `3D`), followed by all other format codes sorted by code, with Andere (`other`) last.
- **Format override flag** (`isFormatOverridden`): an internal per-file boolean. It is `true` when the stored format was set explicitly (a user override, or a legacy asset format preserved by the migration), and `false` when it was detected from the extension, including the automatic fallback to `other`.

Legal files store a format like every other file (schema change only), but their format has no editing control, is not displayed, is not part of asset formats, and is not considered by the migration's exception rule.

Mockups (in `references/`):

- `references/asset-overview.png`
- `references/asset-detail-remove-format-card.png`
- `references/asset-detail-document-format-tags.png`
- `references/general-tab-remove-format-dropdown.png`
- `references/files-tab-format-dropdown.png`

## Requirements and acceptance criteria

### R-01 — Format is owned by the file

- THE SYSTEM SHALL store exactly one format per file, referencing an existing `asset_format_item` entry.
- IF a file would be stored without a format or with an unknown format code, THEN THE SYSTEM SHALL reject the operation and leave the file unchanged.
- THE SYSTEM SHALL store a format override flag for every file, and SHALL determine it on the server only.
- THE SYSTEM SHALL no longer store a format on the asset.

### R-02 — Asset formats are derived from non-legal files

- THE SYSTEM SHALL derive an asset's formats as the distinct formats of its non-legal files, listing each format only once regardless of how many files use it.
- THE SYSTEM SHALL order an asset's formats by the canonical format order wherever they are displayed or exported.
- WHILE an asset has no non-legal files, THE SYSTEM SHALL return an empty format list for it.
- THE SYSTEM SHALL NOT include formats of legal files in an asset's formats.
- WHEN a non-legal file is added, removed, or has its format changed, THE SYSTEM SHALL reflect the change in the asset's formats wherever they are displayed, indexed or exported.

### R-03 — Automatic assignment on upload

- WHEN a file is uploaded without an explicit format, THE SYSTEM SHALL assign its format from the filename's last extension, compared case-insensitively, using this mapping, and SHALL set its format override flag to `false`:

  | Extensions                                                                                      | Format (code)                        |
  | ----------------------------------------------------------------------------------------------- | ------------------------------------ |
  | `.pdf`                                                                                          | PDF (`pdf`)                          |
  | `.shp`, `.shx`, `.dbf`, `.prj`, `.cpg`, `.sbn`, `.sbx`, `.gpkg`, `.qml`, `.qmd`, `.qix`, `.tfw` | Shapefile / GIS format (`GISFormat`) |
  | `.segy`, `.sgy`                                                                                 | SEG / SEGY (`segy`)                  |
  | `.las`                                                                                          | LAS (`las`)                          |
  | `.sqlite`, `.db`, `.sqlite3`, `.accdb`, `.mdb`, `.sql`, `.csv`                                  | DB (`db`)                            |
  | `.doc`, `.docx`, `.txt`, `.odt`, `.rtf`, `.md`                                                  | Text digital (`textDigital`)         |
  | `.jpg`, `.jpeg`, `.tif`, `.tiff`, `.png`, `.webp`, `.gif`                                       | Rastergrafik (`graphicRaster`)       |
  | `.ai`, `.svg`, `.cdr`, `.eps`                                                                   | Vektorgrafik (`graphicVector`)       |
  | `.mp4`, `.mkv`, `.mov`, `.avi`, `.webm`                                                         | Multimedia (`multimedia`)            |
  | `.zip`, `.rar`, `.7z`                                                                           | Archiv (`archive`)                   |
  | `.xls`, `.xlsx`                                                                                 | Spreadsheet (`spreadsheet`)          |
  | `.pptx`                                                                                         | Presentation (`presentation`)        |
  | `.off`, `.3dx`, `.move`, `.movz`                                                                | 3D (`3D`)                            |

- IF the filename has no extension or an extension not listed above (including `.xml`), THEN THE SYSTEM SHALL assign Andere (`other`).
- WHEN a file is uploaded with an explicit format, THE SYSTEM SHALL store that format and set its format override flag to `true`.
- THE SYSTEM SHALL apply the same mapping to non-legal and legal file uploads, so that every stored file has a format.
- THE SYSTEM SHALL use the same mapping for uploads and for the migration (R-05).

### R-04 — Manual format override

- WHEN a user authorized to edit the asset changes a non-legal file's format, THE SYSTEM SHALL store the selected format for that file and set its format override flag to `true` in the same operation.
- THE SYSTEM SHALL decide whether a file's format changed by comparing the submitted format with the persisted format on the server.
- WHEN a save request omits the format of an existing file, THE SYSTEM SHALL preserve the file's stored format and format override flag and SHALL still save its other submitted metadata, so that a stale editor cannot overwrite a newer format.
- WHEN an asset is saved, reloaded, or edited in fields unrelated to a file's format, THE SYSTEM SHALL keep the file's stored format and format override flag, and SHALL NOT recompute the format from the extension.
- IF a user not authorized to edit the asset attempts to change a file's format, THEN THE SYSTEM SHALL reject the request on the backend and leave the format unchanged.

### R-05 — Data migration of existing formats

- WHEN the migration runs, THE SYSTEM SHALL assign a format and a format override flag to every existing file, so that no file is left without them.
- THE SYSTEM SHALL apply the following rules in order; the first matching rule determines a file's format and flag:
  1. A legal file gets its extension-based format and the flag `false`, regardless of the asset's existing format.
  2. A non-legal file gets its extension-based format and the flag `false` if any of the following applies to its asset, evaluated from the asset's non-legal files only:
     - the existing asset format is Andere (`other`);
     - at least one non-legal file's extension-based format equals the existing asset format;
     - the non-legal files have more than one distinct extension-based format. Formats are counted by code, including `other`, so `.xls` and `.xlsx` count as one.
  3. Every other non-legal file gets the existing asset format and the flag `true`.
- THE SYSTEM SHALL NOT depend on asset IDs in these rules, so that the same rules apply on every environment.
- THE SYSTEM SHALL evaluate the conditions of rule 2 from non-legal files only, so that legal files never influence the decision.
- WHEN the migration processes an asset without non-legal files, THE SYSTEM SHALL discard its existing asset format, because no non-legal file exists to inherit it.
- THE SYSTEM SHALL assign each file's format and flag together before removing the asset-level format column.
- WHEN the migration completes, THE SYSTEM SHALL have removed the asset-level format column.

### R-06 — Asset overview table

- THE SYSTEM SHALL keep the current Type column layout, showing each of the asset's types on its own line, followed by the format line.
- THE SYSTEM SHALL show in the format line the asset's formats as a comma-separated list in canonical format order (for example `PDF, Shapefile, SEG, LAS`), replacing the current single format.
- WHILE an asset has no asset formats, THE SYSTEM SHALL show only its types and no format line.
- IF the format list exceeds two lines, THEN THE SYSTEM SHALL truncate it with an ellipsis and show the full list in a tooltip on hover (`references/asset-overview.png`).

### R-07 — Asset detail view

- THE SYSTEM SHALL NOT show the standalone Format card (`references/asset-detail-remove-format-card.png`).
- THE SYSTEM SHALL show each document's format in the Documents card as a tag beside its filename, before its size (`references/asset-detail-document-format-tags.png`).
- THE SYSTEM SHALL NOT show format tags in the Legal documents card.

### R-08 — General editing tab

- THE SYSTEM SHALL NOT show an asset-level format dropdown in the General editing tab (`references/general-tab-remove-format-dropdown.png`).
- WHEN an asset is created or saved, THE SYSTEM SHALL NOT require an asset-level format.

### R-09 — Files editing tab

- THE SYSTEM SHALL show a Format dropdown for each file in the normal files list, offering all `asset_format_item` entries, including Spreadsheet, Presentation and the manual-only entries `binary`, `seismic`, `textAnalog` and `unknown` (`references/files-tab-format-dropdown.png`).
- WHEN a file is added for upload, THE SYSTEM SHALL preselect its extension-based format as a suggestion.
- WHEN a new file is uploaded with the suggested format unchanged, THE SYSTEM SHALL omit the format from the upload request, so that the server detects it (R-03).
- WHEN a new file is uploaded with a format other than the suggestion, THE SYSTEM SHALL send the selected format as an explicit override (R-03).
- WHEN the user selects another format for an existing file and saves the asset, THE SYSTEM SHALL persist the selected format (R-04).
- WHEN the final format selection of an existing file equals the format loaded when the editor opened, including after changing it and switching back, THE SYSTEM SHALL omit the format from the save request (R-04).
- THE SYSTEM SHALL NOT show a format dropdown or format value in the legal documents tab.

### R-10 — CSV and GeoPackage export

- WHEN assets are exported as CSV or GeoPackage, THE SYSTEM SHALL write each asset's asset formats, localized as today, into the format field.
- WHILE an exported asset has no asset formats, THE SYSTEM SHALL leave its format field empty.

### R-11 — Search and indexing

- THE SYSTEM SHALL return the asset formats in asset search results and asset-detail responses instead of a single asset format.
- WHEN a non-legal file is added, removed or has its format changed, THE SYSTEM SHALL update the asset in the asset search index and the asset data stored in the file search index.
- WHEN the search index is rebuilt, THE SYSTEM SHALL index the derived asset formats.

### R-12 — Workflow change tracking

- WHEN a non-legal file's format changes, THE SYSTEM SHALL treat it as a change in the Normal files workflow category instead of the General category.

### R-13 — Synchronization and publication

- WHEN sync-extern transfers files to another environment, THE SYSTEM SHALL preserve each file's stored format and format override flag, including manual overrides.
- WHEN export-to-view publishes files to VIEW, THE SYSTEM SHALL publish each file with its stored format and format override flag, and SHALL NOT publish an asset-level format.

## Open questions and constraints

Open questions: None.

Decisions (2026-11-05):

- `.shp` maps to Shapefile (`GISFormat`).
- Legal-file formats are stored per file only. They have no format editing control, are not displayed, are excluded from the migration's exception rule, and do not contribute to asset formats.
- Legal files receive their extension-based format during migration; they are excluded only from the exception rule.
- Assets without non-legal files lose their existing asset format during migration (confirmed 2026-11-05).
- Asset formats use the canonical format order. It reproduces the mockup's order, is language-independent, and does not depend on upload order.
- The overview keeps the current Type column layout, with the adjustments in R-06.

Decisions (2026-11-12):

- The mapping in R-03 replaces the original mapping. `.xml` now falls back to `other`; `.csv` stays `db`.
- Spreadsheet (`spreadsheet`) and Presentation (`presentation`) are added to the code list. `binary`, `seismic`, `textAnalog` and `unknown` remain available for manual selection only.
- Each file stores an internal format override flag, determined by the server. It is not shown, not editable, and not part of the API.
- Assets with several detected file formats are treated as mixed and bypass format inheritance (R-05).
- The migration `20261105120000_move_format_to_file` has not been applied in any shared environment, so it is edited in place and no forward migration is needed.

Constraints and notes:

- The mapping labels resolve to existing codes after the codelist migration `20260903000000_migrate_topic_kind_format_codelists` (former `shapefile` → `GISFormat`, `segyExported` → `segy`), except `spreadsheet` and `presentation`, which this feature adds.
- The stored format and filename alone cannot reconstruct whether a format was overridden; the flag must therefore be set during the migration and preserved afterwards.
- VIEW publication: formats are now published with files. An asset whose General data is published but whose normal files are not will appear in VIEW with no formats.
- Migration correctness must be verified against a copy of production-like data (INT). Locally, it is verified with test fixtures and a dry run on a pre-migration PROD snapshot.
- Removing `formatCode` from the asset API contract affects all asset consumers in this repository (client, export, search, sync).
