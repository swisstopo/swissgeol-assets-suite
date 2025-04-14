-- CreateEnum
CREATE TYPE "study_geometry_type" AS ENUM ('Point', 'Line', 'Polygon');

-- alter view
DROP VIEW public.all_study;
CREATE VIEW public.all_study
AS
SELECT study_area.asset_id,
   concat('study_area_', study_area.study_area_id::text) AS study_id,
   study_area.study_area_id AS id,
   study_area.geom,
   'Polygon'::study_geometry_type AS geometry_type,
   st_astext(st_centroid(study_area.geom)) AS centroid_geom_text,
   st_astext(study_area.geom) AS geom_text
  FROM study_area
UNION ALL
SELECT study_location.asset_id,
   concat('study_location_', study_location.study_location_id::text) AS study_id,
   study_location.study_location_id AS id,
   study_location.geom,
   'Point'::study_geometry_type AS geometry_type,
   st_astext(st_centroid(study_location.geom)) AS centroid_geom_text,
   st_astext(study_location.geom) AS geom_text
  FROM study_location
UNION ALL
SELECT study_trace.asset_id,
   concat('study_trace_', study_trace.study_trace_id::text) AS study_id,
   study_trace.study_trace_id AS id,
   study_trace.geom,
   'Line'::study_geometry_type AS geometry_type,
   st_astext(st_centroid(study_trace.geom)) AS centroid_geom_text,
   st_astext(study_trace.geom) AS geom_text
  FROM study_trace;
