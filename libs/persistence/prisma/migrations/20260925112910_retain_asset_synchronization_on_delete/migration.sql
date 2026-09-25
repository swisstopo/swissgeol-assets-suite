-- DropForeignKey
ALTER TABLE "asset_synchronization" DROP CONSTRAINT "asset_synchronization_asset_id_fkey";

-- AlterTable
ALTER TABLE "asset_synchronization" ALTER COLUMN "asset_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "asset_synchronization" ADD CONSTRAINT "asset_synchronization_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE SET NULL ON UPDATE CASCADE;
