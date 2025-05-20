/*
  Warnings:

  - You are about to drop the `asset_publication` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pub_channel_item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `publication` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "asset_publication" DROP CONSTRAINT "asset_publication_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_publication" DROP CONSTRAINT "asset_publication_publication_id_fkey";

-- DropForeignKey
ALTER TABLE "publication" DROP CONSTRAINT "publication_pub_channel_item_code_fkey";

-- DropTable
DROP TABLE "asset_publication";

-- DropTable
DROP TABLE "pub_channel_item";

-- DropTable
DROP TABLE "publication";
