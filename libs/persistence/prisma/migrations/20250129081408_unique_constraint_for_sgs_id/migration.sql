/*
  Warnings:

  - A unique constraint covering the columns `[sgs_id]` on the table `asset` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "asset_sgs_id_key" ON "asset"("sgs_id");
