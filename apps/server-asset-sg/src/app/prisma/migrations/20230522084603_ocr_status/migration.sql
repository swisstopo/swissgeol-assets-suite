-- CreateEnum
CREATE TYPE "public"."OcrState" AS ENUM ('willNotBeProcessed', 'created', 'waiting', 'processing', 'error', 'success');

-- AlterTable
ALTER TABLE "public"."file" ADD COLUMN     "ocr_status" "public"."OcrState" NOT NULL DEFAULT 'created';
