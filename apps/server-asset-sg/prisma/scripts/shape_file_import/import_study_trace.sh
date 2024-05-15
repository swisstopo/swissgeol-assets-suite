#/bin/sh

ogr2ogr -nln study_trace -lco GEOMETRY_NAME=geom -lco FID=id -lco PRECISION=NO Pg:"dbname=postgres host=postgres user=postgres port=5432 password=postgres" study_trace.shp

