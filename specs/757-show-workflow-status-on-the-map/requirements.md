# Show workflow status on the map — Requirements

Status: Approved
Approval: Approved by @Dead0utside on 2026-11-13, including the decisions recorded under "Open questions and constraints".

Feature: #757

## Problem and goal

The map colors assets either by geometry type ("Geometrie") or by access ("Freigabe"). Users cannot see where assets stand in the review workflow, so they must open each asset to learn whether it is a draft, in review, reviewed, published or has requested changes.

The goal is another coloring mode that colors each asset by its current workflow status and shows a matching legend.

## User stories

- As an editor or reviewer, I want to color the map by workflow status, so that I can see at a glance which assets still need work or review.
- As a user, I want a legend that pairs each status label with its color, so that I can interpret the map colors.

## Scope

Included:

- Another map coloring mode, "Workflow Status", selectable in the existing map legend next to "Geometrie" and "Freigabe".
- Coloring of all asset geometries (points, lines, polygons) in both map states: the unfiltered overview (`/api/geometries`, generalized to points) and the filtered view (search results, real geometries).
- A legend listing the five categories with their colors, with translations.
- Making the workflow status (and the requested-changes flag) available to the map: `/api/geometries` response, `Geometry` and `AssetSearchResultItem` shared models, Elasticsearch index data, and the client parsing in `GeometryService`.

Excluded:

- Filtering by workflow status (an existing status filter is not changed).
- Changes to the "Geometrie" and "Freigabe" modes, to the workflow itself, or to who may see which assets. The map continues to show only assets the user may already access.
- Any new way of changing the status.

Definitions:

- **Workflow status**: `WorkflowStatus` (`Draft`, `InReview`, `Reviewed`, `Published`) of the asset's workflow (`asset.workflowStatus`, database `workflow.status`).
- **Requested changes**: the workflow flag `hasRequestedChanges` (database `has_requested_changes`), shown in the asset editor as the chip `workflow.requestedChanges`. It is not a `WorkflowStatus` value, but is shown on the map as a fifth legend category that overrides the color of unpublished statuses.
- **Map category**: the category an asset is shown as on the map: "Requested changes" if the asset is unpublished (`Draft`, `InReview` or `Reviewed`) and the flag is true, otherwise its workflow status. A `Published` asset is always shown as Published, regardless of the flag.

Mockups (in `references/`):

- `references/open.png` — legend expanded: swap icon, title "Workflow Status", up-chevron, and a list of five entries, each with a colored shape and a label. The map shows polygons, lines and points in the status colors.
- `references/closed.png` — legend collapsed: title "Workflow Status" with a down-chevron. The existing legend behavior (swap control present in both states) is kept; the mockup is a reference for colors, title and entries only.

Colors (as specified by the requester). Four of the five already exist in the map styles and are reused, including their stroke colors; only Draft is new:

| Category          | Fill color           | Existing style it matches                      |
| ----------------- | -------------------- | ---------------------------------------------- |
| Draft             | `rgb(172, 180, 189)` | none (new; stroke `#131b22`, secondary 900)    |
| InReview          | `rgb(245, 158, 11)`  | Geometrie, polygon (stroke `#78350F`)          |
| Reviewed          | `rgb(20, 175, 184)`  | Geometrie, point (`#14AFB8`, stroke `#13474E`) |
| Published         | `rgb(16, 185, 129)`  | Freigabe, public (stroke `#064E3B`)            |
| Requested changes | `rgb(229, 57, 64)`   | Freigabe, internal (stroke `#801519`)          |

## Requirements and acceptance criteria

### R-01 — Select the workflow status mode

- THE SYSTEM SHALL offer "Workflow Status" as a map coloring mode in addition to the existing "Geometrie" and "Freigabe" modes.
- WHEN a user activates the mode switch in the map legend, THE SYSTEM SHALL cycle through the modes in the order Geometrie, Freigabe, Workflow Status, and back to Geometrie, as it does for the existing modes.
- WHEN the "Workflow Status" mode becomes active, THE SYSTEM SHALL restyle the asset geometry layers without reloading the data or changing the map view.
- THE SYSTEM SHALL keep "Geometrie" as the default mode on page load.

### R-02 — Color assets by workflow status

- WHILE the "Workflow Status" mode is active, THE SYSTEM SHALL color every asset geometry according to its asset's map category, using the colors in the table above.
- THE SYSTEM SHALL reuse the existing color definitions (fill and stroke) of the Geometrie and Freigabe modes for the colors that match, and define a new fill only for Draft, with the stroke color `#131b22` (the design token `--sgc-color-secondary--900` of `@swissgeol/ui-core`; OpenLayers styles need the literal value, as CSS variables cannot be resolved there).
- WHILE the mode is active, THE SYSTEM SHALL apply the same color to all geometries of one asset, regardless of geometry type (point, line, polygon).
- WHILE the mode is active, THE SYSTEM SHALL keep the existing shapes per geometry type and the existing polygon transparency, line widths and stacking order, changing only the colors.
- WHERE an unpublished asset has requested changes (R-03), THE SYSTEM SHALL color it with the "Requested changes" color instead of the color of its status.
- WHILE the mode is active, THE SYSTEM SHALL color assets in both the unfiltered overview and the filtered view.
- WHEN an asset is selected or hovered, THE SYSTEM SHALL keep the existing highlighting and dimming behavior while showing the status colors.

### R-03 — Requested changes take precedence over unpublished status

- IF an asset's workflow status is `Draft`, `InReview` or `Reviewed` and `hasRequestedChanges` is true, THEN THE SYSTEM SHALL show it as "Requested changes".
- IF an asset's workflow status is `Published`, THEN THE SYSTEM SHALL show it as Published regardless of `hasRequestedChanges`.
- IF an asset's workflow status is `Draft`, `InReview` or `Reviewed` and `hasRequestedChanges` is not set, THEN THE SYSTEM SHALL color it by its workflow status.
- THE SYSTEM SHALL use the stored flag as-is and SHALL NOT change when the flag is set or cleared.

### R-04 — Legend

- WHILE the "Workflow Status" mode is active, THE SYSTEM SHALL show a legend titled "Workflow Status" with five entries in the order Draft, InReview, Reviewed, Published, Requested changes.
- THE SYSTEM SHALL show each legend entry as a swatch icon in its category color followed by its translated label, as in `references/open.png`.
- WHEN a user collapses or expands the legend, THE SYSTEM SHALL hide or show the entries as for the other modes, keeping the existing legend header layout, including the mode-switch control in both states.
- WHEN the mode is switched, THE SYSTEM SHALL replace the legend title and entries with those of the new mode.
- THE SYSTEM SHALL provide the legend title and labels in German, English, French and Italian.

### R-04a — Translations

- THE SYSTEM SHALL label the four status entries with the existing translation keys `workflowStatus.Draft`, `workflowStatus.InReview`, `workflowStatus.Reviewed` and `workflowStatus.Published`, which match the database values, with their existing values in all four languages (German "Published" is therefore "Veröffentlicht").
- THE SYSTEM SHALL add a new key `mapLayers.workflowStatus.items.requestedChanges` for the requested-changes entry, in the singular form: "Änderung angefordert" (de), "Change requested" (en), "Modification demandée" (fr), "Modifica richiesta" (it). The existing `workflow.requestedChanges` (plural, used by the editor chip) is left unchanged.
- THE SYSTEM SHALL add the key `mapLayers.workflowStatus.name` with the value "Workflow Status" in all four languages.

### R-05 — Provide the workflow status to the map

- THE SYSTEM SHALL include each asset's workflow status and requested-changes flag in the data from which the map is rendered, for both `/api/geometries` and the search results used for the filtered view.
- WHEN an asset's workflow status or requested-changes flag changes by any means (workflow change, publish, creation, import or sync), THE SYSTEM SHALL update the search index data of that asset so that subsequent map requests show the new color.
- THE SYSTEM SHALL NOT expose assets or workflow data to users who may not already access those assets.
- THE SYSTEM SHALL keep the `/api/geometries` response streamable line by line, so that the overview map keeps loading progressively.

### R-05a — Colors stay up to date

- WHEN a user changes an asset's workflow status or requested-changes flag in the application, THE SYSTEM SHALL show the new color on the map immediately, without a page reload, in both the unfiltered and filtered views (as `accessType` already is after an asset update).
- WHEN a user opens or refreshes the map, THE SYSTEM SHALL show the colors matching the current stored workflow data.
- WHEN an asset is deleted or removed from the results, THE SYSTEM SHALL remove its geometries as it does today.

### R-06 — No regression of existing modes

- WHILE the "Geometrie" or "Freigabe" mode is active, THE SYSTEM SHALL render and show legends exactly as before this feature.
- THE SYSTEM SHALL NOT noticeably increase the load time or the payload size of `/api/geometries` beyond what the added status information requires.

## Open questions and constraints

Open questions: None. Decisions made by the requester:

- Draft stroke is `#131b22` (`--sgc-color-secondary--900`).
- FR/IT/EN requested-changes wording is confirmed; German Published is "Veröffentlicht".
- "Up to date at any time" means: the index is updated on every change, the editing user's map updates immediately, and other users see changes on their next map load (no live push).
- Published assets always use the Published color; requested changes only affect Draft, InReview and Reviewed assets. No fallback color is defined for assets without workflow data, since every asset has a workflow.
- The Elasticsearch re-index at deployment covers existing index data.

Constraints:

- The workflow status is currently indexed as `status` on the Elasticsearch document, but not in the `data` payload returned to the client (`AssetSearchResultItem`), and the `/api/geometries` CSV line (`id;assetId;;accessType;x;y`) has no status column; both must be extended without breaking the existing client parsing.
- Requested changes are not indexed at all today.
- Legend title is "Workflow Status" in all languages, per the requester.
- Verification of the rendered colors and of the legend layout against the mockups is manual, in the browser.
