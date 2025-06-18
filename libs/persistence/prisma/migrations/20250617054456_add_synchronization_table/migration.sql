-- CreateTable
CREATE TABLE "asset_synchronization" (
    "id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "original_asset_id" INTEGER NOT NULL,
    "original_sgs_id" INTEGER,
    "sync_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_synchronization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asset_synchronization_asset_id_key" ON "asset_synchronization"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "asset_synchronization_original_asset_id_key" ON "asset_synchronization"("original_asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "asset_synchronization_original_sgs_id_key" ON "asset_synchronization"("original_sgs_id");

-- AddForeignKey
ALTER TABLE "asset_synchronization" ADD CONSTRAINT "asset_synchronization_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;
