/**
 * A row of the GeoPackage `gpkg_spatial_ref_sys` table.
 */
export interface SpatialRefSys {
  srsName: string;
  srsId: number;
  organization: string;
  organizationCoordsysId: number;
  definition: string;
  description: string | null;
}

/**
 * Spatial reference systems that every GeoPackage must contain (GeoPackage 1.2, requirement 11).
 */
export const REQUIRED_SPATIAL_REF_SYS: readonly SpatialRefSys[] = [
  {
    srsName: 'Undefined Cartesian SRS',
    srsId: -1,
    organization: 'NONE',
    organizationCoordsysId: -1,
    definition: 'undefined',
    description: 'undefined Cartesian coordinate reference system',
  },
  {
    srsName: 'Undefined geographic SRS',
    srsId: 0,
    organization: 'NONE',
    organizationCoordsysId: 0,
    definition: 'undefined',
    description: 'undefined geographic coordinate reference system',
  },
  {
    srsName: 'WGS 84 geodetic',
    srsId: 4326,
    organization: 'EPSG',
    organizationCoordsysId: 4326,
    definition:
      'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],' +
      'AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],' +
      'UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AXIS["Latitude",NORTH],AXIS["Longitude",EAST],' +
      'AUTHORITY["EPSG","4326"]]',
    description: 'longitude/latitude coordinates in decimal degrees on the WGS 84 spheroid',
  },
];

/**
 * CH1903+ / LV95, the coordinate reference system in which all asset geometries are stored.
 * The definition matches the one written by GDAL.
 */
export const SRS_LV95: SpatialRefSys = {
  srsName: 'CH1903+ / LV95',
  srsId: 2056,
  organization: 'EPSG',
  organizationCoordsysId: 2056,
  definition:
    'PROJCS["CH1903+ / LV95",GEOGCS["CH1903+",DATUM["CH1903+",SPHEROID["Bessel 1841",6377397.155,299.1528128,' +
    'AUTHORITY["EPSG","7004"]],AUTHORITY["EPSG","6150"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],' +
    'UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4150"]],' +
    'PROJECTION["Hotine_Oblique_Mercator_Azimuth_Center"],PARAMETER["latitude_of_center",46.9524055555556],' +
    'PARAMETER["longitude_of_center",7.43958333333333],PARAMETER["azimuth",90],' +
    'PARAMETER["rectified_grid_angle",90],PARAMETER["scale_factor",1],PARAMETER["false_easting",2600000],' +
    'PARAMETER["false_northing",1200000],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["Easting",EAST],' +
    'AXIS["Northing",NORTH],AUTHORITY["EPSG","2056"]]',
  description: null,
};
