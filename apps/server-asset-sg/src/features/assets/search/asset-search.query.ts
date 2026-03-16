import { AssetId, AssetJSON, AssetSearchQuery, SearchQueries, User } from '@asset-sg/shared/v2';
import { QueryDslDateRangeQuery, QueryDslQueryContainer } from '@elastic/elasticsearch/lib/api/types';
import { SEARCHABLE_FIELDS } from '@/features/assets/search/asset-search.constants';
import { mapLv95ToElastic } from '@/features/assets/search/asset-search.utils';

export interface PageOptions {
  limit?: number;
  offset?: number;
}

/**
 * The state of a multistep asset search.
 */
export interface SearchState {
  /**
   * The assets that match the search.
   * This is a mapping from the assets' id to their serialized JSON string.
   */
  matchedAssets: Map<AssetId, AssetJSON>;

  /**
   * The id of the last asset that has been matched.
   * This is used to enable paginated search results with Elasticsearch.
   *
   * This is `null` if no query has been executed yet.
   */
  lastAssetId: number | null;

  /**
   * The total number of assets, including the ones that were skipped due to offset and limit.
   *
   * This is `null` if no query has been executed yet.
   */
  totalCount: number | null;
}

export const mapQueryToElasticDsl = (query: SearchQueries, user: User): QueryDslQueryContainer => {
  const { must, filter } = mapQueryToElasticDslParts(query, user);
  return {
    bool: {
      must,
      filter,
    },
  };
};

export const mapQueryToElasticDslParts = (
  query: SearchQueries,
  user: User,
): { must: QueryDslQueryContainer[]; filter: QueryDslQueryContainer[] } => {
  const scope = SEARCHABLE_FIELDS;
  const queries: QueryDslQueryContainer[] = [];
  const filters: QueryDslQueryContainer[] = [];

  if (query.text != null && query.text.length > 0) {
    queries.push({
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
    });
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
      format: 'yyyy-MM-dd',
    };
    if (query.createdAt.min != null) {
      createdAtFilter.gte = query.createdAt.min.toString();
    }
    if (query.createdAt.max != null) {
      createdAtFilter.lte = query.createdAt.max.toString();
    }
    filters.push({
      range: {
        createdAt: createdAtFilter,
      },
    });
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
export const makeArrayFilter = <T extends string | number>(field: string, query: T[]): QueryDslQueryContainer => {
  if (query.length === 0) {
    return { bool: { must_not: { exists: { field } } } };
  }
  return {
    bool: {
      should: query.map((term) => ({ term: { [field]: term } })),
    },
  };
};

/**
 * Maps the shared filter parts of an {@link AssetSearchQuery} to Elasticsearch filter clauses.
 * These filters apply to both asset and file indices (which share the same denormalized metadata fields).
 */
export const mapSharedFilterParts = (query: AssetSearchQuery, user: User): QueryDslQueryContainer[] => {
  const filters: QueryDslQueryContainer[] = [];

  if (query.authorId != null) {
    filters.push({ term: { authorIds: query.authorId } });
  }
  if (query.createdAt != null && Object.keys(query.createdAt).length > 0) {
    const createdAtFilter: QueryDslDateRangeQuery = { format: 'yyyy-MM-dd' };
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
    filters.push({ terms: { workgroupId: query.workgroupIds } });
  }
  if (query.favoritesOnly) {
    filters.push({ terms: { favoredByUserIds: [user.id] } });
  }

  return filters;
};

export const mapQueryToFileElasticDsl = (query: AssetSearchQuery, user: User): QueryDslQueryContainer => {
  const { must, filter } = mapQueryToFileElasticDslParts(query, user);
  return { bool: { must, filter } };
};

export const mapQueryToFileElasticDslParts = (
  query: AssetSearchQuery,
  user: User,
): { must: QueryDslQueryContainer[]; filter: QueryDslQueryContainer[] } => {
  const queries: QueryDslQueryContainer[] = [];
  const filters = mapSharedFilterParts(query, user);

  if (query.text != null && query.text.length > 0) {
    queries.push({
      match: {
        content: {
          query: query.text,
          operator: 'and',
        },
      },
    });
  }

  return { must: queries, filter: filters };
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
