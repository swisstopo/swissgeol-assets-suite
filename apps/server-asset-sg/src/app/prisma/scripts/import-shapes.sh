#!/bin/sh

docker run --rm --network asset-swissgeol-ch_default \
    -v $(pwd)/swisstopo-lambda_prodDaten_asset_swissgeol/db:/home osgeo/gdal:ubuntu-full-latest \
    ogr2ogr -F "PostgreSQL" PG:"host=db port=5432 user=postgres dbname=postgres password=postgres" \
    -sql "select id_studyar as study_area_id, id_asset as asset_id, id_geomqua as geom_quality_item_id from study_area" \
    -nln tmp_study_area /home/geometry/study_area.shp
 
docker run --rm --network asset-swissgeol-ch_default \
    -v $(pwd)/swisstopo-lambda_prodDaten_asset_swissgeol/db:/home osgeo/gdal:ubuntu-full-latest \
    ogr2ogr -F "PostgreSQL" PG:"host=db port=5432 user=postgres dbname=postgres password=postgres" \
    -sql "select id_studylo as study_location_id, id_asset as asset_id, id_geomqua as geom_quality_item_id from study_location" \
    -nln tmp_study_location /home/geometry/study_location.shp

docker run --rm --network asset-swissgeol-ch_default \
    -v $(pwd)/swisstopo-lambda_prodDaten_asset_swissgeol/db:/home osgeo/gdal:ubuntu-full-latest \
    ogr2ogr -F "PostgreSQL" PG:"host=db port=5432 user=postgres dbname=postgres password=postgres" \
    -sql "select id_studytr as study_trace_id, id_asset as asset_id, id_geomqua as geom_quality_item_id from study_trace" \
    -nln tmp_study_trace /home/geometry/study_trace.shp
