from typing import TextIO

import geopandas as gpd
import numpy as np
from geopandas import GeoDataFrame
import os

from shapely import Polygon

# The following parameters need to be adjusted to the correct values:
filedir = ''
filename = 'geometries.gpkg'
output_filename = 'import_geometries.sql'
output_sgsids_filename = 'sgsids.txt'

# The following sgsids are not in the database, they were manually translated to the probably correct sgsid:
sgsid_translation_dict = {}

# Only use entries with Bemerkung equal to one of the following:
allowed_bemerkung = ['erraten', 'erraten_B', 'neu', 'neu (?)', 'unsich kein B']

def read_gdf(file: str, layer: str, allowed_bemerkung: list, translation_dict: dict):
    '''Read a geopandas dataframe from a file and layer, filter out entries with Bemerkung not in allowed_bemerkung and translate the sgsid according to translationDict.'''
    gdf = gpd.read_file(file, layer=layer)
    print(gdf['Bemerkung'].value_counts())
    gdf = gdf[(gdf['Bemerkung'].isin(allowed_bemerkung))]
    gdf.replace({'IDSGS_neu': translation_dict}, inplace=True)
    return gdf

def write_insert_statements(f: TextIO, gdf: GeoDataFrame, geom_type: str):
    for i, row in gdf.iterrows():
        f.write(
            f"INSERT INTO study_{geom_type} (asset_id, geom_quality_item_code, geom) VALUES ((SELECT asset_id FROM asset WHERE sgs_id = {row['IDSGS_neu']}), 'revised', ST_GeomFromText('{row['geometry'].wkt}', 2056));\n")

def remove_interior_polygons(gdf: GeoDataFrame):
    '''Remove interior polygons from a GeoDataFrame of polygons.'''
    gdf['geometry'] = gdf['geometry'].apply(lambda x: Polygon(x.exterior.coords))
    return gdf

def main():
    path = os.path.join(filedir, filename)
    gdf_points = read_gdf(file=path, layer='backup_20240829__points', allowed_bemerkung=allowed_bemerkung, translation_dict=sgsid_translation_dict)
    gdf_lines = read_gdf(file=path, layer='backup_20240829__lines', allowed_bemerkung=allowed_bemerkung, translation_dict=sgsid_translation_dict)
    gdf_polygons = read_gdf(file=path, layer='backup_20240829__polygons', allowed_bemerkung=allowed_bemerkung, translation_dict=sgsid_translation_dict)
    gdf_lines = gdf_lines.explode() # explode multi-linestrings to linestrings
    gdf_polygons = gdf_polygons.explode() # explode multi-polygons to polygons
    gdf_polygons = remove_interior_polygons(gdf_polygons) # remove holes from polygons
    gdf_points = gdf_points[~gdf_points['geometry'].is_empty] # remove empty geometries

    sgs_ids = np.unique(np.concatenate(
        [gdf_lines['IDSGS_neu'].unique(),
         gdf_points['IDSGS_neu'].unique(),
         gdf_polygons['IDSGS_neu'].unique()]))

    np.savetxt(os.path.join(filedir, output_sgsids_filename), sgs_ids.astype(int), fmt='%d', delimiter=',')

    # for each sgsid write a sql delete statement to delete all entries with this sgsid. Commit the commands every 1000 rows.
    with open(os.path.join(filedir, output_filename), 'w') as f:
        for i, sgsid in enumerate(sgs_ids):
            f.write(
                f"DELETE FROM study_location WHERE asset_id = (SELECT asset_id FROM asset WHERE sgs_id = {sgsid});\n")
            f.write(f"DELETE FROM study_trace WHERE asset_id = (SELECT asset_id FROM asset WHERE sgs_id = {sgsid});\n")
            f.write(f"DELETE FROM study_area WHERE asset_id = (SELECT asset_id FROM asset WHERE sgs_id = {sgsid});\n")

        f.write('SELECT \'Finished deleting previous studies.\';\n\n')

        # write the insert statements for the points
        f.write('SELECT \'Creating locations.\';\n')
        write_insert_statements(f, gdf_points, 'location')
        f.write('\nSELECT \'Creating trace.\';\n')
        write_insert_statements(f, gdf_lines, 'trace')
        f.write('\nSELECT \'Creating area.\';\n')
        write_insert_statements(f, gdf_polygons, 'area')

if __name__ == '__main__':
    main()
