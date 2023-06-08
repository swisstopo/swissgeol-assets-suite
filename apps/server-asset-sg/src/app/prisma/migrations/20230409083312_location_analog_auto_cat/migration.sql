/*
  Warnings:

  - You are about to drop the `aut_cat` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."aut_cat" DROP CONSTRAINT "aut_cat_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."aut_cat" DROP CONSTRAINT "aut_cat_auto_cat_label_item_code_fkey";

-- AlterTable
ALTER TABLE "public"."asset" ALTER COLUMN "location_analog" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."aut_cat";

-- CreateTable
CREATE TABLE "public"."auto_cat" (
    "auto_cat_id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "auto_cat_label_item_code" TEXT NOT NULL,
    "auto_cat_label_score" INTEGER NOT NULL,

    CONSTRAINT "auto_cat_pkey" PRIMARY KEY ("auto_cat_id")
);

-- AddForeignKey
ALTER TABLE "public"."auto_cat" ADD CONSTRAINT "auto_cat_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."auto_cat" ADD CONSTRAINT "auto_cat_auto_cat_label_item_code_fkey" FOREIGN KEY ("auto_cat_label_item_code") REFERENCES "public"."auto_cat_label_item"("asset_cat_label_item_code") ON DELETE RESTRICT ON UPDATE CASCADE;
