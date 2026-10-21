import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync, SQLInputValue, StatementSync } from 'node:sqlite';
import {
  encodeGeoPackageGeometry,
  Envelope,
  readWkbGeometryType,
  WkbGeometryType,
} from '@/features/assets/export/geopackage/geopackage-geometry';
import { REQUIRED_SPATIAL_REF_SYS, SpatialRefSys } from '@/features/assets/export/geopackage/spatial-ref-sys';

/** `PRAGMA application_id` of a GeoPackage: 'GPKG' as 32-bit integer. */
export const GEOPACKAGE_APPLICATION_ID = 0x47504b47;

/** `PRAGMA user_version` of a GeoPackage 1.2. */
export const GEOPACKAGE_USER_VERSION = 10200;

export const GEOPACKAGE_FILE_NAME = 'assets.gpkg';

const GEOMETRY_COLUMN_NAME = 'geom';
const PRIMARY_KEY_COLUMN_NAME = 'fid';

export enum GeoPackageGeometryType {
  Point = 'POINT',
  MultiLineString = 'MULTILINESTRING',
  MultiPolygon = 'MULTIPOLYGON',
}

const WKB_TYPE_BY_GEOMETRY_TYPE: Record<GeoPackageGeometryType, WkbGeometryType> = {
  [GeoPackageGeometryType.Point]: WkbGeometryType.Point,
  [GeoPackageGeometryType.MultiLineString]: WkbGeometryType.MultiLineString,
  [GeoPackageGeometryType.MultiPolygon]: WkbGeometryType.MultiPolygon,
};

export enum GeoPackageColumnType {
  Integer = 'INTEGER',
  Text = 'TEXT',
  Date = 'DATE',
  Boolean = 'BOOLEAN',
}

/**
 * A value of an attribute column.
 * Dates are expected as `YYYY-MM-DD` strings, booleans are stored as `0` or `1`.
 */
export type GeoPackageValue = string | number | boolean | null;

export interface GeoPackageAttribute {
  name: string;
  type: GeoPackageColumnType;
}

export interface GeoPackageFeatureLayerDefinition {
  name: string;
  geometryType: GeoPackageGeometryType;
  srs: SpatialRefSys;
  attributes: GeoPackageAttribute[];
}

export interface GeoPackageFeature {
  wkb: Uint8Array;
  envelope: Envelope;
  values: GeoPackageValue[];
}

export class GeoPackageGeometryTypeError extends Error {
  constructor(
    readonly layerName: string,
    readonly expectedType: WkbGeometryType,
    readonly actualType: number,
  ) {
    super(`geometry of type ${actualType} can't be written to layer '${layerName}' of type ${expectedType}`);
  }
}

interface FeatureLayer {
  definition: GeoPackageFeatureLayerDefinition;
  insert: StatementSync;
  extent: Envelope | null;
}

/**
 * Writes a GeoPackage 1.2 file containing vector features.
 *
 * Only the tables required by the specification are created: no spatial index, no metadata and no extensions.
 * All writes happen within a single transaction which is committed by {@link finish}.
 */
export class GeoPackageWriter {
  private readonly layers = new Map<string, FeatureLayer>();
  private readonly srsIds = new Set<number>();
  private isFinished = false;
  private isClosed = false;

  private constructor(private readonly db: DatabaseSync) {}

  static create(filePath: string): GeoPackageWriter {
    const db = new DatabaseSync(filePath);
    try {
      // The rollback journal is kept in memory so no side files are created (`OFF` is rejected in defensive mode).
      db.exec(`
        PRAGMA journal_mode = MEMORY;
        PRAGMA synchronous = OFF;
        PRAGMA application_id = ${GEOPACKAGE_APPLICATION_ID};
        PRAGMA user_version = ${GEOPACKAGE_USER_VERSION};
        BEGIN;
        CREATE TABLE gpkg_spatial_ref_sys (
          srs_name TEXT NOT NULL,
          srs_id INTEGER NOT NULL PRIMARY KEY,
          organization TEXT NOT NULL,
          organization_coordsys_id INTEGER NOT NULL,
          definition TEXT NOT NULL,
          description TEXT
        );
        CREATE TABLE gpkg_contents (
          table_name TEXT NOT NULL PRIMARY KEY,
          data_type TEXT NOT NULL,
          identifier TEXT UNIQUE,
          description TEXT DEFAULT '',
          last_change DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
          min_x DOUBLE,
          min_y DOUBLE,
          max_x DOUBLE,
          max_y DOUBLE,
          srs_id INTEGER,
          CONSTRAINT fk_gc_r_srs_id FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys(srs_id)
        );
        CREATE TABLE gpkg_geometry_columns (
          table_name TEXT NOT NULL,
          column_name TEXT NOT NULL,
          geometry_type_name TEXT NOT NULL,
          srs_id INTEGER NOT NULL,
          z TINYINT NOT NULL,
          m TINYINT NOT NULL,
          CONSTRAINT pk_geom_cols PRIMARY KEY (table_name, column_name),
          CONSTRAINT uk_gc_table_name UNIQUE (table_name),
          CONSTRAINT fk_gc_tn FOREIGN KEY (table_name) REFERENCES gpkg_contents(table_name),
          CONSTRAINT fk_gc_srs FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys(srs_id)
        );
      `);
      const writer = new GeoPackageWriter(db);
      REQUIRED_SPATIAL_REF_SYS.forEach((srs) => writer.registerSrs(srs));
      return writer;
    } catch (e) {
      db.close();
      throw e;
    }
  }

  registerSrs(srs: SpatialRefSys): void {
    if (this.srsIds.has(srs.srsId)) {
      return;
    }
    this.db
      .prepare(
        `INSERT INTO gpkg_spatial_ref_sys (srs_name, srs_id, organization, organization_coordsys_id, definition, description)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(srs.srsName, srs.srsId, srs.organization, srs.organizationCoordsysId, srs.definition, srs.description);
    this.srsIds.add(srs.srsId);
  }

  createFeatureLayer(definition: GeoPackageFeatureLayerDefinition): void {
    const { name, geometryType, srs, attributes } = definition;
    if (this.layers.has(name)) {
      throw new Error(`layer '${name}' already exists`);
    }
    const attributeNames = attributes.map((attribute) => attribute.name);
    const reservedNames = new Set([PRIMARY_KEY_COLUMN_NAME, GEOMETRY_COLUMN_NAME]);
    for (const attributeName of attributeNames) {
      if (reservedNames.has(attributeName.toLowerCase())) {
        throw new Error(`attribute name '${attributeName}' is reserved or used multiple times`);
      }
      reservedNames.add(attributeName.toLowerCase());
    }
    this.registerSrs(srs);

    const columnDefinitions = [
      `${quote(PRIMARY_KEY_COLUMN_NAME)} INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL`,
      `${quote(GEOMETRY_COLUMN_NAME)} ${geometryType}`,
      ...attributes.map((attribute) => `${quote(attribute.name)} ${attribute.type}`),
    ];
    this.db.exec(`CREATE TABLE ${quote(name)} (${columnDefinitions.join(', ')})`);
    this.db
      .prepare(
        `INSERT INTO gpkg_contents (table_name, data_type, identifier, description, last_change, srs_id)
         VALUES (?, 'features', ?, '', ?, ?)`,
      )
      .run(name, name, new Date().toISOString(), srs.srsId);
    this.db
      .prepare(
        `INSERT INTO gpkg_geometry_columns (table_name, column_name, geometry_type_name, srs_id, z, m)
         VALUES (?, ?, ?, ?, 0, 0)`,
      )
      .run(name, GEOMETRY_COLUMN_NAME, geometryType, srs.srsId);

    const insertColumns = [GEOMETRY_COLUMN_NAME, ...attributeNames].map(quote);
    const insert = this.db.prepare(
      `INSERT INTO ${quote(name)} (${insertColumns.join(', ')}) VALUES (${insertColumns.map(() => '?').join(', ')})`,
    );
    this.layers.set(name, { definition, insert, extent: null });
  }

  /**
   * @throws GeoPackageGeometryTypeError if the feature's geometry type doesn't match the layer's geometry type.
   */
  insertFeature(layerName: string, feature: GeoPackageFeature): void {
    const layer = this.layers.get(layerName);
    if (layer === undefined) {
      throw new Error(`unknown layer '${layerName}'`);
    }
    const { geometryType, srs, attributes } = layer.definition;
    const expectedWkbType = WKB_TYPE_BY_GEOMETRY_TYPE[geometryType];
    const actualWkbType = readWkbGeometryType(feature.wkb);
    if (actualWkbType !== expectedWkbType) {
      throw new GeoPackageGeometryTypeError(layerName, expectedWkbType, actualWkbType);
    }
    if (feature.values.length !== attributes.length) {
      throw new Error(`expected ${attributes.length} attribute values, got ${feature.values.length}`);
    }

    // Like GDAL, points are written without envelope, as it would be identical to the point itself.
    const geometry = encodeGeoPackageGeometry({
      wkb: feature.wkb,
      srsId: srs.srsId,
      envelope: geometryType === GeoPackageGeometryType.Point ? null : feature.envelope,
    });
    layer.insert.run(geometry, ...feature.values.map(toSqlValue));
    layer.extent = extendEnvelope(layer.extent, feature.envelope);
  }

  finish(): void {
    if (this.isFinished) {
      return;
    }
    const lastChange = new Date().toISOString();
    const update = this.db.prepare(
      `UPDATE gpkg_contents SET min_x = ?, min_y = ?, max_x = ?, max_y = ?, last_change = ? WHERE table_name = ?`,
    );
    for (const [name, { extent }] of this.layers) {
      update.run(
        extent?.minX ?? null,
        extent?.minY ?? null,
        extent?.maxX ?? null,
        extent?.maxY ?? null,
        lastChange,
        name,
      );
    }
    this.db.exec('COMMIT');
    this.isFinished = true;
  }

  close(): void {
    if (!this.isClosed) {
      this.db.close();
      this.isClosed = true;
    }
  }
}

/**
 * Builds a GeoPackage in a unique temporary directory and returns its content.
 * The temporary directory is always removed, regardless of whether the build succeeds.
 *
 * @param build Callback writing the GeoPackage's content. {@link GeoPackageWriter.finish} is called afterwards.
 */
export const withTemporaryGeoPackage = async (
  build: (writer: GeoPackageWriter) => void | Promise<void>,
  options: { tmpRoot?: string } = {},
): Promise<Buffer> => {
  const dir = await mkdtemp(join(options.tmpRoot ?? tmpdir(), 'asset-export-'));
  try {
    const filePath = join(dir, GEOPACKAGE_FILE_NAME);
    const writer = GeoPackageWriter.create(filePath);
    try {
      await build(writer);
      writer.finish();
    } finally {
      writer.close();
    }
    return await readFile(filePath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};

const quote = (identifier: string): string => `"${identifier.replaceAll(/"/g, '""')}"`;

const toSqlValue = (value: GeoPackageValue): SQLInputValue => {
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  return value;
};

const extendEnvelope = (current: Envelope | null, next: Envelope): Envelope =>
  current === null
    ? { ...next }
    : {
        minX: Math.min(current.minX, next.minX),
        maxX: Math.max(current.maxX, next.maxX),
        minY: Math.min(current.minY, next.minY),
        maxY: Math.max(current.maxY, next.maxY),
      };
