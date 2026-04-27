import { Asset, AssetId, ContactId, ElasticsearchPoint, GeometryType, UserId } from '@asset-sg/shared/v2';
import { PrismaClient } from '@prisma/client';
import { mapLv95ToElastic } from '@/features/assets/search/asset-search.utils';
import { GeometryRepo } from '@/features/geometries/geometry.repo';

export interface SearchWriterOptions {
  index: string;
  shouldRefresh?: boolean;
  isEager?: boolean;
}

export interface GeometryMetadata {
  types: GeometryType[] | ['None'];
  locations: ElasticsearchPoint[];
}

export interface SharedEagerData {
  contactIdToName: Map<ContactId, string>;
  assetIdToFavoredByUserId: Map<AssetId, UserId[]>;
  assetIdToGeometryMetadata: Map<AssetId, GeometryMetadata>;
}

export async function fetchContactNamesForAsset(
  asset: Asset,
  eagerData: SharedEagerData | null | undefined,
  prisma: PrismaClient,
): Promise<string[]> {
  if (eagerData != null) {
    const names: string[] = [];
    for (const contact of asset.contacts) {
      const name = eagerData.contactIdToName.get(contact.id);
      if (name !== undefined) {
        names.push(name);
      }
    }
    return names;
  }
  const contacts = await prisma.contact.findMany({
    select: { name: true },
    where: { contactId: { in: asset.contacts.map((it) => it.id) } },
  });
  return contacts.map((it) => it.name);
}

export async function fetchFavoredByUserIdsForAsset(
  asset: Asset,
  eagerData: SharedEagerData | null | undefined,
  prisma: PrismaClient,
): Promise<string[]> {
  if (eagerData != null) {
    return eagerData.assetIdToFavoredByUserId.get(asset.id) ?? [];
  }
  const favoredByUsers = await prisma.assetUser.findMany({
    select: { id: true },
    where: { favorites: { some: { assetId: asset.id } } },
  });
  return favoredByUsers.map(({ id }) => id);
}

export async function fetchGeometryMetadataForAsset(
  asset: Asset,
  eagerData: SharedEagerData | null | undefined,
  geometryRepo: GeometryRepo,
): Promise<GeometryMetadata> {
  if (eagerData != null) {
    return eagerData.assetIdToGeometryMetadata.get(asset.id) ?? { types: ['None'], locations: [] };
  }
  const geometries = await geometryRepo.list({ assetIds: [asset.id] });
  if (geometries.length === 0) {
    return { types: ['None'], locations: [] };
  }
  const types = new Set<GeometryType>();
  const locations: ElasticsearchPoint[] = [];
  for (const geometry of geometries) {
    types.add(geometry.type);
    locations.push(mapLv95ToElastic(geometry.center));
  }
  return { types: [...types], locations };
}

export function buildFavoritesMap(records: Array<{ assetId: AssetId; userId: UserId }>): Map<AssetId, UserId[]> {
  const mapping = new Map<AssetId, UserId[]>();
  for (const { assetId, userId } of records) {
    const userIds = mapping.get(assetId);
    if (userIds === undefined) {
      mapping.set(assetId, [userId]);
    } else {
      userIds.push(userId);
    }
  }
  return mapping;
}

export function buildGeometryMetadataMap(
  geometries: Array<{ assetId: AssetId; type: GeometryType; center: { x: number; y: number } }>,
): Map<AssetId, GeometryMetadata> {
  const byAsset = new Map<AssetId, { types: Set<GeometryType>; locations: ElasticsearchPoint[] }>();
  for (const geometry of geometries) {
    if (!byAsset.has(geometry.assetId)) {
      byAsset.set(geometry.assetId, { types: new Set(), locations: [] });
    }
    const entry = byAsset.get(geometry.assetId)!;
    entry.types.add(geometry.type);
    entry.locations.push(mapLv95ToElastic(geometry.center));
  }
  const result = new Map<AssetId, GeometryMetadata>();
  for (const [assetId, { types, locations }] of byAsset) {
    result.set(assetId, { types: types.size > 0 ? [...types] : ['None'], locations });
  }
  return result;
}

export async function fetchSharedEagerData(prisma: PrismaClient, geometryRepo: GeometryRepo): Promise<SharedEagerData> {
  const [contactIdToName, assetIdToFavoredByUserId, assetIdToGeometryMetadata] = await Promise.all([
    fetchEagerContactNames(prisma),
    fetchEagerFavorites(prisma),
    fetchEagerGeometryMetadata(geometryRepo),
  ]);
  return { contactIdToName, assetIdToFavoredByUserId, assetIdToGeometryMetadata };
}

async function fetchEagerContactNames(prisma: PrismaClient): Promise<Map<ContactId, string>> {
  const contacts = await prisma.contact.findMany({
    select: { contactId: true, name: true },
  });
  const mapping = new Map<ContactId, string>();
  for (const { contactId, name } of contacts) {
    mapping.set(contactId, name);
  }
  return mapping;
}

async function fetchEagerFavorites(prisma: PrismaClient): Promise<Map<AssetId, UserId[]>> {
  const favorites = await prisma.favorite.findMany({
    select: { assetId: true, userId: true },
  });
  return buildFavoritesMap(favorites);
}

async function fetchEagerGeometryMetadata(geometryRepo: GeometryRepo): Promise<Map<AssetId, GeometryMetadata>> {
  const geometries = await geometryRepo.list({});
  return buildGeometryMetadataMap(geometries);
}
