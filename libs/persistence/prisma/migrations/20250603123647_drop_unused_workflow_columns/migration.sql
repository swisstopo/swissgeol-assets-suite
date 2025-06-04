/*
  Warnings:

  - You are about to drop the column `last_processed_date` on the `asset` table. All the data in the column will be lost.
  - You are about to drop the column `processor` on the `asset` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "asset" DROP COLUMN "last_processed_date",
DROP COLUMN "processor";
