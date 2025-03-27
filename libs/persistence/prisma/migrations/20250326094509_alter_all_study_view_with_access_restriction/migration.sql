-- Drop and recreate the view
DROP VIEW IF EXISTS public.all_study;
CREATE VIEW public.all_study AS
WITH studies AS (SELECT study_area.asset_id,
                        CONCAT('study_area_', study_area.study_area_id::TEXT) AS study_id,
                        study_area.study_area_id                              AS id,
                        study_area.geom,
                        'Polygon'::study_geometry_type AS geometry_type, ST_AsText(ST_Centroid(study_area.geom)) AS centroid_geom_text,
                        ST_AsText(study_area.geom)                            AS geom_text
                 FROM study_area

                 UNION ALL

                 SELECT study_location.asset_id,
                        CONCAT('study_location_', study_location.study_location_id::TEXT) AS study_id,
                        study_location.study_location_id                                  AS id,
                        study_location.geom,
                        'Point'::study_geometry_type AS geometry_type, ST_AsText(ST_Centroid(study_location.geom)) AS centroid_geom_text,
                        ST_AsText(study_location.geom)                                    AS geom_text
                 FROM study_location

                 UNION ALL

                 SELECT study_trace.asset_id,
                        CONCAT('study_trace_', study_trace.study_trace_id::TEXT) AS study_id,
                        study_trace.study_trace_id                               AS id,
                        study_trace.geom,
                        'Line'::study_geometry_type AS geometry_type, ST_AsText(ST_Centroid(study_trace.geom)) AS centroid_geom_text,
                        ST_AsText(study_trace.geom)                              AS geom_text
                 FROM study_trace),
     access AS (SELECT a.asset_id,
                       p.is_available AS is_public,
                       i.is_available AS is_internal
                FROM asset a
                       LEFT JOIN public_use p ON a.public_use_id = p.public_use_id
                       LEFT JOIN internal_use i ON a.internal_use_id = i.internal_use_id)
SELECT studies.*,
       access.is_public,
       access.is_internal
FROM studies
       LEFT JOIN access ON studies.asset_id = access.asset_id;
