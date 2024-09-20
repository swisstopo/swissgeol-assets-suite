/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  AssetByTitle,
  AssetEditDetail,
  AssetSearchQuery,
  AssetSearchResult,
  AssetSearchStats,
  dateFromDateId,
  DateId,
  dateIdFromDate,
  ElasticPoint,
  ElasticSearchAsset,
  GeometryCode,
  LV95,
  makeUsageCode,
  SearchAssetAggregations,
  SearchAssetResult,
  SerializedAssetEditDetail,
  UsageCode,
  ValueCount,
} from '@asset-sg/shared';
import { AssetId, StudyId } from '@asset-sg/shared/v2';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import {
  BulkOperationContainer,
  QueryDslNumberRangeQuery,
  QueryDslQueryContainer,
  SearchTotalHits,
} from '@elastic/elasticsearch/lib/api/types';
import { Injectable, Logger } from '@nestjs/common';
import * as E from 'fp-ts/Either';
import proj4 from 'proj4';

// eslint-disable-next-line @nx/enforce-module-boundaries
import indexMapping from '../../../../../../development/init/elasticsearch/mappings/swissgeol_asset_asset.json';

import { PrismaService } from '@/core/prisma.service';
import { AssetEditRepo } from '@/features/asset-edit/asset-edit.repo';
import { StudyRepo } from '@/features/studies/study.repo';

const INDEX = 'swissgeol_asset_asset';
export { INDEX as ASSET_ELASTIC_INDEX };

interface SearchOptions {
  scope: Array<keyof ElasticSearchAsset>;
  assetIds?: AssetId[];
}

interface ElasticSearchResult {
  scoresByAssetId: Map<AssetId, number>;
  aggs: SearchAssetAggregations;
}

@Injectable()
export class AssetSearchService {
  constructor(
    private readonly elastic: ElasticsearchClient,
    private readonly prisma: PrismaService,
    private readonly assetRepo: AssetEditRepo,
    private readonly studyRepo: StudyRepo
  ) {}

  register(oneOrMore: AssetEditDetail | AssetEditDetail[]): Promise<void> {
    return this.registerWithOptions(oneOrMore, { index: INDEX, shouldRefresh: true });
  }

  async count(): Promise<number> {
    return (await this.elastic.count({ index: INDEX, ignore_unavailable: true })).count;
  }

  async syncWithDatabase(onProgress?: (percentage: number) => void | Promise<void>): Promise<void> {
    // Write all Prisma assets into the sync index.
    const total = await this.prisma.asset.count();
    if (total === 0) {
      Logger.debug('no assets to sync');
      if (onProgress != null) {
        onProgress(1);
      }
      return;
    }

    // Initialize a temporary sync index.
    const SYNC_INDEX = `sync-${INDEX}-${getDateTimeString()}`;
    const existsSyncIndex = await this.elastic.indices.exists({ index: SYNC_INDEX });
    if (existsSyncIndex) {
      throw new Error(`can't sync to '${SYNC_INDEX}', index already exists`);
    }

    await this.elastic.indices.create({ index: SYNC_INDEX });
    await this.elastic.indices.putMapping({
      index: SYNC_INDEX,
      ...indexMapping,
    });

    let offset = 0;
    for (;;) {
      Logger.debug(`synced ${offset} of ${total} assets`);
      const records = await this.assetRepo.list({ limit: 1000, offset });
      if (records.length === 0) {
        break;
      }
      await this.registerWithOptions(records, { index: SYNC_INDEX });
      offset += records.length;
      if (onProgress != null) {
        await onProgress(Math.min(offset / total, 1));
      }
    }
    Logger.debug(`synced ${total} of ${total} assets`);

    // Delete the existing asset index.
    await this.elastic.indices.delete({ index: INDEX, ignore_unavailable: true });

    // Recreate the asset index and configure its mapping.
    await this.elastic.indices.create({ index: INDEX });
    await this.elastic.indices.putMapping({
      index: INDEX,
      ...indexMapping,
    });

    // Refresh the sync index, so we can reindex its contents.
    await this.elastic.indices.refresh({ index: SYNC_INDEX });

    // Copy the sync index's contents into the empty asset index.
    await this.elastic.reindex({
      source: { index: SYNC_INDEX },
      dest: { index: INDEX },
    });

    // Refresh the asset index so its contents are searchable.
    await this.elastic.indices.refresh({ index: INDEX });

    // Delete the sync index.
    await this.elastic.indices.delete({ index: SYNC_INDEX });
  }

  private async registerWithOptions(
    oneOrMore: AssetEditDetail | AssetEditDetail[],
    { index, shouldRefresh = false }: { index: string; shouldRefresh?: boolean }
  ): Promise<void> {
    const assets = Array.isArray(oneOrMore) ? oneOrMore : [oneOrMore];
    const operations: Array<BulkOperationContainer | ElasticSearchAsset> = Array(assets.length * 2);
    const mappings: Array<Promise<void>> = Array(assets.length);
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      mappings[i] = this.mapAssetToElastic(asset).then((elasticAsset) => {
        operations[i * 2] = { index: { _index: index, _id: `${elasticAsset.assetId}` } };
        operations[i * 2 + 1] = elasticAsset;
      });
    }
    await Promise.all(mappings);
    await this.elastic.bulk({
      index,
      refresh: shouldRefresh,
      operations,
    });
  }

  /**
   * @deprecated Part of the old search API. Will be removed when the new API goes live.
   */
  async searchOld(query: string, options: SearchOptions): Promise<SearchAssetResult> {
    const elasticResult = await this.searchElasticOld(query, options);
    return await this.loadAssetsByElasticResult(elasticResult);
  }

  /**
   * Searches for assets using a {@link AssetSearchQuery}.
   *
   * @param query The query to match with.
   * @param limit The maximum amount of assets to load. Defaults to `100`.
   * @param offset The amount of assets being skipped before loading the assets.
   * @param decode Whether to decode the assets. If this is set to `false`, the assets should be decoded via `AssetEditDetail` before accessing them.
   *               This option primarily exists so that the assets are not decoded and directly re-encoded when returning them via API.
   */
  async search(
    query: AssetSearchQuery,
    { limit = 100, offset = 0, decode = true }: PageOptions & { decode?: boolean } = {}
  ): Promise<AssetSearchResult> {
    // Apply the query to find all matching ids.
    const [serializedAssets, total] = await this.searchAssetsByQuery(query, { limit, offset });

    // Load the matched assets from the database.
    const data: AssetEditDetail[] = [];
    for (const serializedAsset of serializedAssets.values()) {
      const asset = JSON.parse(serializedAsset);
      data.push(decode ? (AssetEditDetail.decode(asset) as E.Right<AssetEditDetail>).right : asset);
    }

    // Return the matched data in a paginated format.
    return {
      page: {
        offset,
        size: data.length,
        total,
      },
      data,
    };
  }

  /**
   * Aggregates the stats over all assets matching a specific {@link AssetSearchQuery}.
   *
   * @param query The query to match with.
   */
  async aggregate(query: AssetSearchQuery): Promise<AssetSearchStats> {
    interface Result {
      minCreateDate: { value: DateId };
      maxCreateDate: { value: DateId };
      authorIds: {
        buckets: AggregationBucket<number>[];
      };
      assetKindItemCodes: {
        buckets: AggregationBucket[];
      };
      languageItemCodes: {
        buckets: AggregationBucket[];
      };
      geometryCodes: {
        buckets: AggregationBucket<GeometryCode | 'None'>[];
      };
      manCatLabelItemCodes: {
        buckets: AggregationBucket[];
      };
      usageCodes: {
        buckets: AggregationBucket<UsageCode>[];
      };
      workgroupIds: {
        buckets: AggregationBucket<number>[];
      };
    }

    interface AggregationBucket<K = string> {
      key: K;
      doc_count: number;
    }

    const aggregateGroup = async (
      query: AssetSearchQuery,
      operator: 'terms' | 'min' | 'max',
      groupName: string,
      fieldName?: string
    ) => {
      const NUMBER_OF_BUCKETS = 10_000;
      const elasticDslQuery = mapQueryToElasticDsl({ ...query, [groupName]: undefined });
      const field: { field: string; size?: number } = { field: fieldName ?? groupName, size: NUMBER_OF_BUCKETS };
      if (operator !== 'terms') {
        delete field.size;
      }
      return (
        await this.elastic.search({
          index: INDEX,
          size: 0,
          query: elasticDslQuery,
          track_total_hits: true,
          aggregations: {
            agg: { [operator]: field },
          },
        })
      ).aggregations?.agg;
    };

    const elasticQuery = mapQueryToElasticDsl(query);
    const response = await this.elastic.search({
      index: INDEX,
      size: 0,
      query: elasticQuery,
      track_total_hits: true,
    });
    const total = (response.hits.total as SearchTotalHits).value;
    if (total === 0) {
      return {
        total: 0,
        assetKindItemCodes: [],
        authorIds: [],
        createDate: null,
        languageItemCodes: [],
        geometryCodes: [],
        manCatLabelItemCodes: [],
        usageCodes: [],
        workgroupIds: [],
      };
    }

    const [
      assetKindItemCodes,
      authorIds,
      languageItemCodes,
      geometryCodes,
      manCatLabelItemCodes,
      usageCodes,
      workgroupIds,
      minCreateDate,
      maxCreateDate,
    ] = await Promise.all([
      aggregateGroup(query, 'terms', 'assetKindItemCodes', 'assetKindItemCode'),
      aggregateGroup(query, 'terms', 'authorIds'),
      aggregateGroup(query, 'terms', 'languageItemCodes'),
      aggregateGroup(query, 'terms', 'geometryCodes'),
      aggregateGroup(query, 'terms', 'manCatLabelItemCodes'),
      aggregateGroup(query, 'terms', 'usageCodes', 'usageCode'),
      aggregateGroup(query, 'terms', 'workgroupIds', 'workgroupId'),
      aggregateGroup(query, 'min', 'minCreateDate', 'createDate'),
      aggregateGroup(query, 'max', 'maxCreateDate', 'createDate'),
    ]);
    const aggs = {
      assetKindItemCodes,
      authorIds,
      languageItemCodes,
      geometryCodes,
      manCatLabelItemCodes,
      usageCodes,
      workgroupIds,
      minCreateDate,
      maxCreateDate,
    } as unknown as Result;

    const mapBucket = <T>(bucket: AggregationBucket<T>): ValueCount<T> => ({
      value: bucket.key,
      count: bucket.doc_count,
    });
    return {
      total,
      assetKindItemCodes: aggs.assetKindItemCodes.buckets.map(mapBucket),
      authorIds: aggs.authorIds.buckets.map(mapBucket),
      languageItemCodes: aggs.languageItemCodes.buckets.map(mapBucket),
      geometryCodes: aggs.geometryCodes.buckets.map(mapBucket),
      manCatLabelItemCodes: aggs.manCatLabelItemCodes.buckets.map(mapBucket),
      usageCodes: aggs.usageCodes.buckets.map(mapBucket),
      workgroupIds: aggs.workgroupIds.buckets.map(mapBucket),
      createDate: {
        min: dateFromDateId(aggs.minCreateDate.value),
        max: dateFromDateId(aggs.maxCreateDate.value),
      },
    };
  }

  /**
   * @deprecated Part of the old search API. Will be removed when the new API goes live.
   */
  async searchByTitle(title: string): Promise<AssetByTitle[]> {
    interface SearchHit {
      _score: number;
      fields: {
        assetId: [number];
        titlePublic: [string];
      };
    }

    const response = await this.elastic.search({
      index: INDEX,
      size: 10_000,
      query: {
        bool: {
          must: {
            query_string: {
              query: `*${title}*`,
              fields: ['titlePublic'],
            },
          },
        },
      },
      fields: ['assetId', 'titlePublic'],
      _source: false,
    });
    return (response.hits.hits as unknown as SearchHit[]).map((hit) => ({
      score: hit._score,
      assetId: hit.fields.assetId[0],
      titlePublic: hit.fields.titlePublic[0],
    }));
  }

  private async searchAssetsByQuery(
    query: AssetSearchQuery,
    page: PageOptions = {}
  ): Promise<[Map<AssetId, SerializedAssetEditDetail>, number]> {
    const BATCH_SIZE = 10_000;

    const elasticQuery = mapQueryToElasticDsl(query);
    const matchedAssets = new Map<number, string>();
    let lastAssetId: number | null = null;
    let totalCount: number | null = null;

    let remainingOffset = page.offset ?? 0;
    while (remainingOffset > 0) {
      const remainingLimit = Math.min(BATCH_SIZE, remainingOffset);
      if (remainingLimit <= 0) {
        break;
      }
      const response = await this.elastic.search({
        index: INDEX,
        query: elasticQuery,
        fields: ['assetId'],
        size: remainingLimit,
        sort: {
          assetId: 'desc',
        },
        _source: false,
        track_total_hits: totalCount == null,
        search_after: lastAssetId == null ? undefined : [lastAssetId],
      });
      totalCount ??= (response.hits.total as SearchTotalHits).value as number;
      if (response.hits.hits.length < remainingLimit) {
        return [matchedAssets, totalCount];
      }
      remainingOffset -= response.hits.hits.length;
      lastAssetId = response.hits.hits[response.hits.hits.length - 1].fields!['assetId'][0] as number;
    }

    for (;;) {
      const remainingLimit = page.limit == null ? BATCH_SIZE : Math.min(BATCH_SIZE, page.limit - matchedAssets.size);
      if (remainingLimit <= 0 && totalCount != null) {
        return [matchedAssets, totalCount];
      }
      const response = await this.elastic.search({
        index: INDEX,
        query: elasticQuery,
        fields: ['assetId', 'data'],
        size: remainingLimit,
        sort: {
          assetId: 'desc',
        },
        track_total_hits: totalCount == null,
        _source: false,
        search_after: lastAssetId == null ? undefined : [lastAssetId],
      });
      totalCount ??= (response.hits.total as SearchTotalHits).value as number;
      if (response.hits.hits.length === 0) {
        return [matchedAssets, totalCount];
      }
      for (const hit of response.hits.hits) {
        const assetId: number = hit.fields!['assetId'][0];
        const data = hit.fields!['data'][0];
        matchedAssets.set(assetId, data);
        lastAssetId = assetId;
      }
      if (totalCount <= (page.offset ?? 0) + matchedAssets.size) {
        return [matchedAssets, totalCount];
      }
    }
  }

  private async searchElasticOld(query: string, { scope, assetIds }: SearchOptions): Promise<ElasticSearchResult> {
    const filters: QueryDslQueryContainer[] = [];
    if (assetIds != null) {
      filters.push({ terms: { assetId: assetIds } });
    }

    const response = await this.elastic.search({
      index: INDEX,
      size: 10_000,
      query: {
        bool: {
          should: [
            {
              multi_match: {
                query,
                fields: scope,
                fuzziness: 'AUTO',
              },
            },
            {
              query_string: {
                query: `*${escapeElasticQuery(query)}*`,
                fields: scope,
              },
            },
            {
              query_string: {
                query: query,
                fields: scope,
              },
            },
          ],
          filter: filters,
        },
      },
      aggs: {
        authorIds: { terms: { field: 'authorIds' } },
        minCreateDate: { min: { field: 'createDate' } },
        maxCreateDate: { max: { field: 'createDate' } },
        assetKindItemCodes: { terms: { field: 'assetKindItemCode' } },
        languageItemCodes: { terms: { field: 'languageItemCodes' } },
        usageCodes: { terms: { field: 'usageCode' } },
        manCatLabelItemCodes: { terms: { field: 'manCatLabelItemCodes' } },
      },
      fields: ['assetId'],
      _source: false,
    });

    interface ElasticSearchResult {
      hits: {
        hits: Array<{
          _score: number;
          fields: {
            assetId: [number];
          };
        }>;
      };
      aggregations: {
        minCreateDate: { value: DateId };
        maxCreateDate: { value: DateId };
        authorIds: {
          buckets: AggregationBucket<number>[];
        };
        assetKindItemCodes: {
          buckets: AggregationBucket[];
        };
        languageItemCodes: {
          buckets: AggregationBucket[];
        };
        usageCodes: {
          buckets: AggregationBucket<UsageCode>[];
        };
        manCatLabelItemCodes: {
          buckets: AggregationBucket[];
        };
      };
    }

    interface AggregationBucket<K = string> {
      key: K;
      doc_count: number;
    }

    const { aggregations: aggs, hits } = response as unknown as ElasticSearchResult;
    const scoresByAssetId = new Map<number, number>();
    for (const hit of hits.hits) {
      scoresByAssetId.set(hit.fields.assetId[0], hit._score);
    }
    const searchAggs: SearchAssetAggregations = {
      ranges: {
        createDate: {
          min: aggs.minCreateDate.value,
          max: aggs.maxCreateDate.value,
        },
      },
      buckets: {
        authorIds: aggs.authorIds.buckets.map((agg) => ({
          key: agg.key,
          count: agg.doc_count,
        })),
        assetKindItemCodes: aggs.assetKindItemCodes.buckets.map((agg) => ({
          key: agg.key,
          count: agg.doc_count,
        })),
        languageItemCodes: aggs.languageItemCodes.buckets.map((agg) => ({
          key: agg.key,
          count: agg.doc_count,
        })),
        usageCodes: aggs.usageCodes.buckets.map((agg) => ({
          key: agg.key,
          count: agg.doc_count,
        })),
        manCatLabelItemCodes: aggs.manCatLabelItemCodes.buckets.map((agg) => ({
          key: agg.key,
          count: agg.doc_count,
        })),
      },
    };

    return { scoresByAssetId, aggs: searchAggs };
  }

  private async loadAssetsByElasticResult({ scoresByAssetId, aggs }: ElasticSearchResult): Promise<SearchAssetResult> {
    if (scoresByAssetId.size === 0) {
      return { _tag: 'SearchAssetResultEmpty' };
    }
    const entities = await this.prisma.asset.findMany({
      where: {
        assetId: { in: [...scoresByAssetId.keys()] },
      },
      select: {
        assetId: true,
        titlePublic: true,
        createDate: true,
        assetKindItemCode: true,
        assetFormatItemCode: true,
        assetLanguages: true,
        internalUse: {
          select: {
            isAvailable: true,
          },
        },
        publicUse: {
          select: {
            isAvailable: true,
          },
        },
        allStudies: {
          select: {
            studyId: true,
            geomText: true,
          },
        },
        assetContacts: {
          select: {
            contactId: true,
            role: true,
          },
        },
        manCatLabelRefs: {
          select: {
            manCatLabelItemCode: true,
          },
        },
      },
    });
    return {
      _tag: 'SearchAssetResultNonEmpty',
      aggregations: aggs,
      assets: entities.map((entity) => {
        const { assetId } = entity;
        const score = scoresByAssetId.get(assetId);
        if (score == null) {
          throw new Error(`found prisma entity that was not part of the elastic result: ${assetId}`);
        }
        return {
          score,
          assetId,
          titlePublic: entity.titlePublic,
          createDate: dateIdFromDate(entity.createDate),
          assetFormatItemCode: entity.assetFormatItemCode,
          assetKindItemCode: entity.assetKindItemCode,
          languages: entity.assetLanguages.map((it) => ({ code: it.languageItemCode })),
          contacts: entity.assetContacts.map((contact) => ({
            id: contact.contactId,
            role: contact.role,
          })),
          studies: entity.allStudies,
          manCatLabelItemCodes: entity.manCatLabelRefs.map((ref) => ref.manCatLabelItemCode),
          usageCode: makeUsageCode(entity.publicUse.isAvailable, entity.internalUse.isAvailable),
        };
      }),
    };
  }

  private async mapAssetToElastic(asset: AssetEditDetail): Promise<ElasticSearchAsset> {
    const contacts = await this.prisma.contact.findMany({
      select: {
        name: true,
      },
      where: {
        contactId: { in: asset.assetContacts.map((it) => it.contactId) },
      },
    });
    const geometryCodes: GeometryCode[] = [];
    const studyLocations: ElasticPoint[] = [];
    for (const study of asset.studies) {
      const geometryCode = (() => {
        const prefix = study.geomText.split('(', 2)[0];
        switch (prefix) {
          case 'POINT':
            return GeometryCode.Point;
          case 'POLYGON':
            return GeometryCode.Polygon;
          case 'LINESTRING':
            return GeometryCode.LineString;
          default:
            throw new Error(`unknown geomText prefix: ${prefix} for asset ${asset.assetId}`);
        }
      })();
      geometryCodes.push(geometryCode);

      const fullStudy = await this.studyRepo.find(study.studyId as StudyId);
      if (fullStudy != null) {
        studyLocations.push(mapLv95ToElastic(fullStudy.center));
      }
    }

    const languageItemCodes =
      asset.assetLanguages.length === 0 ? ['None'] : asset.assetLanguages.map((it) => it.languageItemCode);
    return {
      assetId: asset.assetId,
      titlePublic: asset.titlePublic,
      titleOriginal: asset.titleOriginal,
      sgsId: asset.sgsId,
      createDate: asset.createDate,
      assetKindItemCode: asset.assetKindItemCode,
      languageItemCodes,
      usageCode: makeUsageCode(asset.publicUse.isAvailable, asset.internalUse.isAvailable),
      authorIds: asset.assetContacts.filter((it) => it.role === 'author').map((it) => it.contactId),
      contactNames: contacts.map((it) => it.name),
      manCatLabelItemCodes: asset.manCatLabelRefs,
      geometryCodes: geometryCodes.length > 0 ? [...new Set(geometryCodes)] : ['None'],
      studyLocations,
      workgroupId: asset.workgroupId,
      data: JSON.stringify(AssetEditDetail.encode(asset)),
    };
  }
}

const lv95Projection =
  '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs';
const wgs84Projection = proj4.WGS84;

const mapLv95ToElastic = (lv95: LV95): ElasticPoint => {
  const wgs = proj4(lv95Projection, wgs84Projection, [lv95.x as number, lv95.y as number]);
  return { lat: wgs[1], lon: wgs[0] };
};

const mapQueryToElasticDsl = (query: AssetSearchQuery): QueryDslQueryContainer => {
  const scope = ['titlePublic', 'titleOriginal', 'contactNames', 'sgsId'];
  const queries: QueryDslQueryContainer[] = [];
  const filters: QueryDslQueryContainer[] = [];
  if (query.text != null && query.text.length > 0) {
    queries.push({
      bool: {
        should: [
          {
            query_string: {
              query: normalizeFieldQuery(query.text),
              fields: scope,
            },
          },
        ],
      },
    });
  }
  if (query.authorId != null) {
    filters.push({
      term: {
        authorIds: query.authorId,
      },
    });
  }
  if (query.createDate != null && Object.keys(query.createDate).length > 0) {
    const createDateFilter: QueryDslNumberRangeQuery = {};
    if (query.createDate.min != null) {
      createDateFilter.gte = dateIdFromDate(query.createDate.min);
    }
    if (query.createDate.max != null) {
      createDateFilter.lte = dateIdFromDate(query.createDate.max);
    }
    filters.push({
      range: {
        createDate: createDateFilter,
      },
    });
  }
  if (query.manCatLabelItemCodes != null) {
    filters.push(makeArrayFilter('manCatLabelItemCodes', query.manCatLabelItemCodes));
  }
  if (query.assetKindItemCodes != null) {
    filters.push(makeArrayFilter('assetKindItemCode', query.assetKindItemCodes));
  }
  if (query.usageCodes != null) {
    filters.push(makeArrayFilter('usageCode', query.usageCodes));
  }
  if (query.languageItemCodes != null) {
    filters.push(makeArrayFilter('languageItemCodes', query.languageItemCodes));
  }
  if (query.geometryCodes != null) {
    filters.push(makeArrayFilter('geometryCodes', query.geometryCodes));
  }
  if (query.workgroupIds != null) {
    filters.push({
      terms: {
        workgroupId: query.workgroupIds,
      },
    });
  }
  if (query.polygon != null) {
    queries.push({
      geo_polygon: {
        studyLocations: {
          points: query.polygon.map(mapLv95ToElastic),
        },
      },
    });
  }

  return {
    bool: {
      must: queries,
      filter: filters,
    },
  };
};

/**
 * Create an Elasticsearch filter that matches all documents which contain a specific field
 * that contains any of a given set of values (the _query_).
 *
 * When the query is empty, only documents for which the field does not exist are matched.
 * A field does also count as "not existing" when it is set to `null` or an empty array.
 *
 * @param field The field to match.
 * @param query The set of allowed values.
 */
const makeArrayFilter = <T extends string | number>(
  field: keyof ElasticSearchAsset,
  query: T[]
): QueryDslQueryContainer => {
  if (query.length === 0) {
    return { bool: { must_not: { exists: { field } } } };
  }
  return {
    bool: {
      should: query.map((term) => ({ term: { [field]: term } })),
    },
  };
};

const getDateTimeString = (): string => {
  const now = new Date();
  const padZero = (value: number): string | number => {
    if (value >= 10) {
      return value;
    }
    return `0${value}`;
  };
  return (
    '' +
    now.getUTCFullYear() +
    padZero(now.getUTCMonth()) +
    padZero(now.getUTCDate()) +
    padZero(now.getUTCHours()) +
    padZero(now.getUTCMinutes()) +
    padZero(now.getUTCSeconds())
  );
};

interface PageOptions {
  limit?: number;
  offset?: number;
}

const escapeElasticQuery = (query: string): string => {
  return query.replace(/(&&|\|\||!|\(|\)|\{|}|\[|]|\^|"|~|\*|\?|:|\\)/g, '\\$1');
};

const normalizeFieldQuery = (query: string): string =>
  query
    .replace(/title(_*)public:/gi, 'titlePublic:')
    .replace(/title(_*)original:/gi, 'titleOriginal:')
    .replace(/contact(_*)ame:/gi, 'contactNames:')
    .replace(/sgs(_*)id:/gi, 'sgsId:');
