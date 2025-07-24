-- Drop and recreate the view
DROP VIEW IF EXISTS public.all_study;
CREATE VIEW public.all_study AS
WITH studies AS (SELECT study_area.asset_id,
                        CONCAT('study_area_', study_area.study_area_id::TEXT) AS study_id,
                        study_area.study_area_id                        AS id,
                        ST_CENTROID(study_area.geom)                    AS centroid,
                        ST_ASTEXT(study_area.geom)                      AS geom_text,
                        'Polygon'::study_geometry_type AS geometry_type
                 FROM study_area

                 UNION ALL

                 SELECT study_location.asset_id,
                        CONCAT('study_location_', study_location.study_location_id::TEXT) AS study_id,
                        study_location.study_location_id                            AS id,
                        ST_CENTROID(study_location.geom)                            AS centroid,
                        ST_ASTEXT(study_location.geom)                              AS geom_text,
                        'Point'::study_geometry_type AS geometry_type
                 FROM study_location

                 UNION ALL

                 SELECT study_trace.asset_id,
                        CONCAT('study_trace_', study_trace.study_trace_id::TEXT) AS study_id,
                        study_trace.study_trace_id                         AS id,
                        ST_CENTROID(study_trace.geom)                      AS centroid,
                        ST_ASTEXT(study_trace.geom)                        AS geom_text,
                        'Line'::study_geometry_type AS geometry_type
                 FROM study_trace)
SELECT studies.*,
       a.is_public
FROM studies
       LEFT JOIN asset a ON studies.asset_id = a.asset_id;

-- DropForeignKey
ALTER TABLE "asset" DROP CONSTRAINT "asset_internal_use_id_fkey";

-- DropForeignKey
ALTER TABLE "asset" DROP CONSTRAINT "asset_public_use_id_fkey";

-- DropForeignKey
ALTER TABLE "internal_use" DROP CONSTRAINT "internal_use_status_asset_use_item_code_fkey";

-- DropForeignKey
ALTER TABLE "public_use" DROP CONSTRAINT "public_use_status_asset_use_item_code_fkey";

-- DropForeignKey
ALTER TABLE "status_work" DROP CONSTRAINT "status_work_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "status_work" DROP CONSTRAINT "status_work_status_work_item_code_fkey";

-- AlterTable
ALTER TABLE "asset" DROP COLUMN "internal_use_id",
DROP COLUMN "public_use_id";

-- DropTable
DROP TABLE "internal_use";

-- DropTable
DROP TABLE "public_use";

-- DropTable
DROP TABLE "status_asset_use_item";

-- DropTable
DROP TABLE "status_work";

-- DropTable
DROP TABLE "status_work_item";

