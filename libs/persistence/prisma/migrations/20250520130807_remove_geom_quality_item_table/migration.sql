/*
  Warnings:

  - You are about to drop the `geom_quality_item` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "study_area" DROP CONSTRAINT "study_area_geom_quality_item_code_fkey";

-- DropForeignKey
ALTER TABLE "study_location" DROP CONSTRAINT "study_location_geom_quality_item_code_fkey";

-- DropForeignKey
ALTER TABLE "study_trace" DROP CONSTRAINT "study_trace_geom_quality_item_code_fkey";

-- DropTable
DROP TABLE "geom_quality_item";
