/*
  Warnings:

  - You are about to drop the `asset_user_favourite` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "asset_user_favourite" DROP CONSTRAINT "asset_user_favourite_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_user_favourite" DROP CONSTRAINT "asset_user_favourite_asset_user_id_fkey";

-- DropTable
DROP TABLE "asset_user_favourite";

-- CreateTable
CREATE TABLE "favorite" (
    "user_id" UUID NOT NULL,
    "asset_id" INTEGER NOT NULL,

    CONSTRAINT "favorite_pkey" PRIMARY KEY ("user_id","asset_id")
);

-- AddForeignKey
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "asset_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;
