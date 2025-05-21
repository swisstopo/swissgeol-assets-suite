-- Add boolean columns
ALTER TABLE "study_area"
  ADD COLUMN "is_revised" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "study_location"
  ADD COLUMN "is_revised" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "study_trace"
  ADD COLUMN "is_revised" BOOLEAN NOT NULL DEFAULT false;
COMMENT ON COLUMN "study_area"."is_revised" IS 'this referenced geom_quality_item table, but contained only unkown (sic!) and revised; kept for records';
COMMENT ON COLUMN "study_location"."is_revised" IS 'this referenced geom_quality_item table, but contained only unkown (sic!) and revised; kept for records';
COMMENT ON COLUMN "study_trace"."is_revised" IS 'this referenced geom_quality_item table, but contained only unkown (sic!) and revised; kept for records';

-- Update values to reflect is_revised status
UPDATE "study_area" SET is_revised = true WHERE "geom_quality_item_code" = 'revised';
UPDATE "study_location" SET is_revised = true WHERE "geom_quality_item_code" = 'revised';
UPDATE "study_trace" SET is_revised = true WHERE "geom_quality_item_code" = 'revised';

-- Drop old columns
ALTER TABLE "study_area" DROP COLUMN "geom_quality_item_code";
ALTER TABLE "study_location" DROP COLUMN "geom_quality_item_code";
ALTER TABLE "study_trace" DROP COLUMN "geom_quality_item_code";
