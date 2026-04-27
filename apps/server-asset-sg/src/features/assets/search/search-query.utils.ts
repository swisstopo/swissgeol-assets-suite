import { ElasticsearchAsset, SearchQueries, SearchType, standardDateFormat, User } from '@asset-sg/shared/v2';
import {
  AggregationsAggregationContainer,
  QueryDslDateRangeQuery,
  QueryDslQueryContainer,
} from '@elastic/elasticsearch/lib/api/types';
import { AGGREGATION_NUMBER_OF_BUCKETS, SEARCHABLE_FIELDS } from '@/features/assets/search/asset-search.constants';
import { mapLv95ToElastic } from '@/features/assets/search/asset-search.utils';

export interface PageOptions {
  limit?: number;
  offset?: number;
}

export const mapQueryToElasticDsl = (query: SearchQueries, user: User): QueryDslQueryContainer => {
  const { must, filter } = mapQueryToElasticDslParts(query, user);
  return { bool: { must, filter } };
};

export const mapQueryToElasticDslParts = (
  query: SearchQueries,
  user: User,
): {
  must: QueryDslQueryContainer[];
  filter: QueryDslQueryContainer[];
  aggs: Record<string, AggregationsAggregationContainer>;
} => {
  const scope = SEARCHABLE_FIELDS;
  const queries: QueryDslQueryContainer[] = [];
  const filters: QueryDslQueryContainer[] = [];
  const aggs: Record<string, AggregationsAggregationContainer> = {};

  if (query.type === SearchType.File) {
    aggs['distinct_assets'] = {
      cardinality: { field: 'assetId' },
    };
    aggs['distinct_files'] = {
      cardinality: { field: 'fileId' },
    };
  }

  if (query.text != null && query.text.length > 0) {
    let textQuery: QueryDslQueryContainer | undefined = undefined;

    switch (query.type) {
      case SearchType.Asset:
        textQuery = {
          bool: {
            should: [
              {
                query_string: {
                  query: escapeElasticQuery(normalizeFieldQuery(query.text)),
                  fields: scope,
                },
              },
            ],
          },
        };
        break;
      case SearchType.File:
        textQuery = {
          match: {
            content: {
              query: query.text,
              operator: 'and',
            },
          },
        };
        break;
    }

    if (textQuery) {
      queries.push(textQuery);
    }
  }

  if (query.authorId != null) {
    filters.push({
      term: {
        authorIds: query.authorId,
      },
    });
  }
  if (query.createdAt != null && Object.keys(query.createdAt).length > 0) {
    const createdAtFilter: QueryDslDateRangeQuery = {
      format: standardDateFormat,
    };
    if (query.createdAt.min != null) {
      createdAtFilter.gte = query.createdAt.min.toString();
    }
    if (query.createdAt.max != null) {
      createdAtFilter.lte = query.createdAt.max.toString();
    }
    filters.push({ range: { createdAt: createdAtFilter } });
  }
  if (query.topicCodes != null) {
    filters.push(makeArrayFilter('topicCodes', query.topicCodes));
  }
  if (query.kindCodes != null) {
    filters.push(makeArrayFilter('kindCode', query.kindCodes));
  }
  if (query.usageCodes != null) {
    filters.push(makeArrayFilter('usageCode', query.usageCodes));
  }
  if (query.languageCodes != null) {
    filters.push(makeArrayFilter('languageCodes', query.languageCodes));
  }
  if (query.geometryTypes != null) {
    filters.push(makeArrayFilter('geometryTypes', query.geometryTypes));
  }
  if (query.status != null) {
    filters.push(makeArrayFilter('status', query.status));
  }
  if (query.workgroupIds != null) {
    filters.push({
      terms: {
        workgroupId: query.workgroupIds,
      },
    });
  }
  if (query.favoritesOnly) {
    filters.push({
      terms: {
        favoredByUserIds: [user.id],
      },
    });
  }

  if (query.polygon != null) {
    queries.push({
      geo_polygon: {
        locations: {
          points: query.polygon.map(mapLv95ToElastic),
        },
      },
    });
  }
  return {
    must: queries,
    filter: filters,
    aggs,
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
export const makeArrayFilter = <T extends string | number>(
  field: keyof ElasticsearchAsset,
  query: T[],
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

export const getDateTimeString = (): string => {
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

/**
 * Escapes special characters in an Elasticsearch query string. Preserves wildcards (*) since this is what users might
 * use. This is a fix for a long-standing issue after io-ts refactor (see assets-639 for details).
 *
 * Furthermore, it also escapes the colon (:) character, but then un-escapes it for specific fields that are allowed to
 * be searched, to avoid issues when users search for e.g. "title:My Title".
 */
export const escapeElasticQuery = (query: string): string => {
  let escaped = query.replace(/(&&|\|\||!|\(|\)|\{|}|\[|]|\^|"|~|\+|-|=|\?|:|\\|\/)/g, '\\$1');

  for (const field of SEARCHABLE_FIELDS) {
    escaped = escaped.replaceAll(new RegExp(String.raw`\b${field}\\:`, 'gi'), `${field}:`);
  }

  return escaped;
};

/**
 * Helper function for backwards compatibility of field names in search queries.
 */
export const normalizeFieldQuery = (query: string): string =>
  query
    .replace(/title(_*)public:/gi, 'title:')
    .replace(/title(_*)original:/gi, 'originalTitle:')
    .replace(/contact(_*)name:/gi, 'contactNames:')
    .replace(/asset(_*)id:/gi, 'id:')
    .replace(/sgs(_*)id:/gi, 'sgsId:');

type MakeAggregationFunction = (
  operator: 'terms' | 'min' | 'max',
  groupName: string,
  fieldName?: string,
  queryOverride?: SearchQueries,
) => AggregationsAggregationContainer;

/**
 * Creates a {@link MakeAggregationFunction} that builds filtered aggregation containers.
 *
 * Each aggregation bucket excludes its own field from the query filter so that
 * selecting a value in one facet doesn't collapse that facet's own counts.
 *
 * When the caller passes a `queryOverride` (e.g. for the unrestricted workgroup bucket),
 * that override is used as the base query instead of the default.
 */
export const createMakeAggregation = (query: SearchQueries, user: User): MakeAggregationFunction => {
  return (operator, groupName, fieldName, queryOverride) => {
    const baseQuery = queryOverride ?? query;
    const { filter, aggs } = mapQueryToElasticDslParts({ ...baseQuery, [groupName]: undefined }, user);
    const field = fieldName ?? groupName;
    if (operator === 'terms') {
      return {
        filter: { bool: { filter } },
        aggs: {
          a: { terms: { field, size: AGGREGATION_NUMBER_OF_BUCKETS }, aggs },
        },
      };
    }
    return {
      filter: { bool: { filter } },
      aggs: { a: { [operator]: { field } } },
    };
  };
};
