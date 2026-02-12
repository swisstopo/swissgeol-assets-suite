# Developer Docs

This document is intended to provide an overview of common tasks, gotchas and general information for developers working on this project. It is not meant to be an exhaustive guide,
but rather a starting point for new contributors and a reference for existing ones without having to reinvent the wheel every time.

## Infrastructure

### Deploying to a new environment

Coming soon - information about what

## Features

Various common features and their implementation details are documented here. This is not meant to be an exhaustive list of all features,
but rather a collection of common ones that may require additional context or have non-trivial implementations.

### Adding new translations

Whenever a new translation key is added, it needs to be added to the `de.ts` file first, as this is used for type inference in the other languages.

All keys need to be translated (e.g. using [DeepL](https://www.deepl.com/translator)). **Newly added keys need then to be added to the list in `translations-guidelines.md`.** This list will be periodically reviewed by the Swissgeol team and, if needed, returned back to us for corrections.

### Adding a new search filter

Search filters can be added easily, but they require multiple changes throughout the app in seemingly unrelated places. Luckily, due to almost fully consistent typing, most of the steps below come naturally; however, some non-typed aspects still remain.

1. Indexing configuration

- Adjust `swissgeol_asset_asset.json` index configuration by adding a new `keyword` field
- Update `ElasticSearchAsset` interface
- Update `AssetSearchWriter`

2. Search configuration

- Update `AssetSearchQuery` and `AssetSearchStats` interface and corresponding schemas
- Add a new selector to `asset-search.selector`
- Update aggregations in `AssetSearchService`

3. UI configuration

- Add a new `asset-sg-asset-search-filter` component to `asset-search-refine.component` with the appropriate selector and options
- Add `QUERY_PARAM_MAPPING` and corresponding update methods in `viewer-param.service` to ensure that the filter is properly reflected in the URL and can be shared

4. (optional) If the filter is attached to another model than `Asset` or `Workflow`, make sure that the registration of the asset is triggered as well. As an example, since `status` is part of the `Workflow` model, the registration for the Elasticsearch writer had to be adapted to also trigger within the `Workflow` handling (see [#860](https://github.com/swisstopo/swissgeol-assets-suite/pull/860))

For reference, the steps for the `status` filter can be traced in PRS [#849](https://github.com/swisstopo/swissgeol-assets-suite/pull/849) and [#864](https://github.com/swisstopo/swissgeol-assets-suite/pull/864).
