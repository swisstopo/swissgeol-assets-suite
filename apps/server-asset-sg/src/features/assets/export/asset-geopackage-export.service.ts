import { AssetId, LocalDate, User } from '@asset-sg/shared/v2';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AssetExportDataset, ExportValue, ExportValueType } from '@/features/assets/export/asset-export-metadata';
import { AssetExportMetadataService } from '@/features/assets/export/asset-export-metadata.service';
import { ExportLanguage } from '@/features/assets/export/asset-export.i18n';
import {
  GEOPACKAGE_FILE_NAME,
  GeoPackageColumnType,
  GeoPackageGeometryType,
  GeoPackageGeometryTypeError,
  GeoPackageValue,
  withTemporaryGeoPackage,
} from '@/features/assets/export/geopackage/geopackage-writer';
import { SRS_LV95 } from '@/features/assets/export/geopackage/spatial-ref-sys';
import { ExportGeometry, ExportGeometryLayer, GeometryExportRepo } from '@/features/geometries/geometry-export.repo';

/**
 * The name of the GeoPackage within a combined export archive.
 */
export const GEOPACKAGE_ARCHIVE_ENTRY_NAME = GEOPACKAGE_FILE_NAME;

export const GEOPACKAGE_MEDIA_TYPE = 'application/geopackage+sqlite3';

const MULTI_VALUE_SEPARATOR = ',';

const EVENT_LOOP_YIELD_INTERVAL_MS = 50;

interface LayerDefinition {
  layer: ExportGeometryLayer;
  geometryType: GeoPackageGeometryType;
}

/** All layers are always created, even if they don't contain any features. */
const LAYERS: readonly LayerDefinition[] = [
  { layer: ExportGeometryLayer.Points, geometryType: GeoPackageGeometryType.Point },
  { layer: ExportGeometryLayer.Lines, geometryType: GeoPackageGeometryType.MultiLineString },
  { layer: ExportGeometryLayer.Polygons, geometryType: GeoPackageGeometryType.MultiPolygon },
];

const COLUMN_TYPES: Record<ExportValueType, GeoPackageColumnType> = {
  [ExportValueType.Text]: GeoPackageColumnType.Text,
  [ExportValueType.TextList]: GeoPackageColumnType.Text,
  [ExportValueType.Integer]: GeoPackageColumnType.Integer,
  [ExportValueType.Date]: GeoPackageColumnType.Date,
  [ExportValueType.Boolean]: GeoPackageColumnType.Boolean,
};

export interface GeoPackageBuildOptions {
  tmpRoot?: string;
}

/**
 * Exports the geometries of assets as GeoPackage, with the assets' metadata as feature attributes.
 *
 * Each geometry becomes a feature in the layer matching its type (`points`, `lines` or `polygons`).
 * The metadata of an asset is repeated for each of its geometries. Assets without geometries are omitted.
 */
@Injectable()
export class AssetGeoPackageExportService {
  constructor(
    private readonly metadataService: AssetExportMetadataService,
    private readonly geometryExportRepo: GeometryExportRepo,
  ) {}

  async exportAssetsAsGeoPackage(assetIds: AssetId[], user: User, language: ExportLanguage): Promise<Buffer> {
    const dataset = await this.metadataService.load(assetIds, user, language);
    return this.build(dataset);
  }

  /** Expects metadata that has already been authorized for the user. */
  async build(dataset: AssetExportDataset, options: GeoPackageBuildOptions = {}): Promise<Buffer> {
    const assetIds = dataset.records.map((record) => record.asset.id);
    const { geometries } = await this.geometryExportRepo.listForExport(assetIds);
    this.assertExportable(geometries);

    const geometriesByAsset = new Map<AssetId, ExportGeometry[]>();
    for (const geometry of geometries) {
      const assetGeometries = geometriesByAsset.get(geometry.assetId) ?? [];
      assetGeometries.push(geometry);
      geometriesByAsset.set(geometry.assetId, assetGeometries);
    }

    const attributes = dataset.columns.map((column) => ({ name: column.name, type: COLUMN_TYPES[column.type] }));
    try {
      const content = await withTemporaryGeoPackage(async (writer) => {
        for (const { layer, geometryType } of LAYERS) {
          writer.createFeatureLayer({ name: layer, geometryType, srs: SRS_LV95, attributes });
        }
        // Writing is synchronous, so we periodically yield to avoid blocking the event loop on large exports.
        let sliceStartedAt = performance.now();
        for (const record of dataset.records) {
          const values = record.values.map((value, i) => toGeoPackageValue(dataset.columns[i].type, value));
          for (const geometry of geometriesByAsset.get(record.asset.id) ?? []) {
            writer.insertFeature(geometry.layer, { wkb: geometry.wkb, envelope: geometry.envelope, values });
            if (performance.now() - sliceStartedAt > EVENT_LOOP_YIELD_INTERVAL_MS) {
              await new Promise((resolve) => setImmediate(resolve));
              sliceStartedAt = performance.now();
            }
          }
        }
      }, options);
      return content;
    } catch (e) {
      if (e instanceof GeoPackageGeometryTypeError) {
        throw new InternalServerErrorException();
      }
      throw e;
    }
  }

  /** The database schema prevents unexpected types and SRIDs, so this should never fail. */
  private assertExportable(geometries: ExportGeometry[]): void {
    const expectedTypes = new Map(LAYERS.map(({ layer, geometryType }) => [layer as string, geometryType as string]));
    const invalid = geometries.filter(
      (geometry) => expectedTypes.get(geometry.layer) !== geometry.geometryType || geometry.srid !== SRS_LV95.srsId,
    );
    if (invalid.length === 0) {
      return;
    }
    throw new InternalServerErrorException();
  }
}

const toGeoPackageValue = (type: ExportValueType, value: ExportValue): GeoPackageValue => {
  if (value === null) {
    return null;
  }
  switch (type) {
    case ExportValueType.TextList: {
      const values = value as string[];
      return values.length === 0 ? null : values.join(MULTI_VALUE_SEPARATOR);
    }
    case ExportValueType.Date:
      return formatDate(value as LocalDate);
    case ExportValueType.Text:
    case ExportValueType.Integer:
    case ExportValueType.Boolean:
      return value as string | number | boolean;
  }
};

export const formatDate = (date: LocalDate): string => `${pad(date.year, 4)}-${pad(date.month, 2)}-${pad(date.day, 2)}`;

const pad = (value: number, length: number): string => value.toString().padStart(length, '0');
