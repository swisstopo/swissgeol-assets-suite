-- DropForeignKey
ALTER TABLE "favorite" DROP CONSTRAINT "favorite_asset_id_fkey";

-- AddForeignKey
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;
