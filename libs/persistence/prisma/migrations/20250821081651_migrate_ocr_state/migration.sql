-- CreateEnum
CREATE TYPE "FileProcessingStage" AS ENUM ('Ocr', 'Extraction');

-- CreateEnum
CREATE TYPE "FileProcessingState" AS ENUM ('WillNotBeProcessed', 'Waiting', 'Processing', 'Error', 'Success');

-- AddColumn
ALTER TABLE "public"."file"
  ADD COLUMN "file_processing_state" "public"."FileProcessingState" NOT NULL DEFAULT 'WillNotBeProcessed'::"FileProcessingState",
  ADD COLUMN "file_processing_stage" "public"."FileProcessingStage"
;

-- AddConstraint to enforce that files without processingstage are in 'WillNotBeProcessed' state
ALTER TABLE "public"."file"
  ADD CONSTRAINT check_a_b
    CHECK (
      "file_processing_stage" IS NOT NULL OR "file_processing_state" = 'WillNotBeProcessed'::"FileProcessingState"
      );

-- Set stage - if "willNotBeProcessed" is set, then stage is NULL
UPDATE "public"."file"
SET "file_processing_stage" =
      CASE "ocr_status"
        WHEN 'willNotBeProcessed' THEN NULL
        ELSE 'Ocr'::"FileProcessingStage"
        END;
-- Migrate existing values, setting 'Created' to 'Waiting'
UPDATE "public"."file"
SET "file_processing_state" =
      CASE "ocr_status"
        WHEN 'willNotBeProcessed' THEN 'WillNotBeProcessed'::"FileProcessingState"
        WHEN 'created' THEN 'Waiting'::"FileProcessingState"
        WHEN 'waiting' THEN 'Waiting'::"FileProcessingState"
        WHEN 'processing' THEN 'Processing'::"FileProcessingState"
        WHEN 'error' THEN 'Error'::"FileProcessingState"
        WHEN 'success' THEN 'Success'::"FileProcessingState"
        END;

-- Drop old ocr_status column
ALTER TABLE "public"."file"
  DROP COLUMN "ocr_status";

-- DropEnum
DROP TYPE "OcrState";
