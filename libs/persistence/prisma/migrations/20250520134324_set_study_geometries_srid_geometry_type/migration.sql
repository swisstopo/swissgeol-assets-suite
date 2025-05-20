-- Set proper geometry types for study tables and fix their SRS
-- Note: Because all_study depends on the geometry columns, it has to be dropped and recreated.

DO $$
DECLARE
view_sql text;
BEGIN
SELECT pg_get_viewdef('all_study', true)
INTO view_sql;

DROP VIEW IF EXISTS all_study;

ALTER TABLE study_location
ALTER
COLUMN geom
TYPE geometry(Point, 2056)
USING ST_SetSRID(geom::geometry, 2056);

ALTER TABLE study_area
ALTER
COLUMN geom
TYPE geometry(Polygon, 2056)
USING ST_SetSRID(geom::geometry, 2056);

ALTER TABLE study_trace
ALTER
COLUMN geom
TYPE geometry(LineString, 2056)
USING ST_SetSRID(geom::geometry, 2056);

-- Recreate the view using the definition stored in the variable
EXECUTE 'CREATE VIEW all_study AS ' || view_sql;
END$$;
