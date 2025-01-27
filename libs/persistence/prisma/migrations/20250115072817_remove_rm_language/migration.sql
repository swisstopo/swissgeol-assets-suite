/*
  Warnings:

  - You are about to drop the column `description_rm` on the `asset_format_item` table. All the data in the column will be lost.
  - You are about to drop the column `name_rm` on the `asset_format_item` table. All the data in the column will be lost.
  - You are about to drop the column `description_rm` on the `asset_kind_item` table. All the data in the column will be lost.
  - You are about to drop the column `name_rm` on the `asset_kind_item` table. All the data in the column will be lost.
  - You are about to drop the column `description_rm` on the `auto_cat_label_item` table. All the data in the column will be lost.
  - You are about to drop the column `name_rm` on the `auto_cat_label_item` table. All the data in the column will be lost.
  - You are about to drop the column `description_rm` on the `auto_object_cat_item` table. All the data in the column will be lost.
  - You are about to drop the column `name_rm` on the `auto_object_cat_item` table. All the data in the column will be lost.
  - You are about to drop the column `description_rm` on the `contact_kind_item` table. All the data in the column will be lost.
  - You are about to drop the column `name_rm` on the `contact_kind_item` table. All the data in the column will be lost.
  - You are about to drop the column `description_rm` on the `geom_quality_item` table. All the data in the column will be lost.
  - You are about to drop the column `name_rm` on the `geom_quality_item` table. All the data in the column will be lost.
  - You are about to drop the column `description_rm` on the `language_item` table. All the data in the column will be lost.
  - You are about to drop the column `name_rm` on the `language_item` table. All the data in the column will be lost.
  - You are about to drop the column `description_rm` on the `legal_doc_item` table. All the data in the column will be lost.
  - You are about to drop the column `name_rm` on the `legal_doc_item` table. All the data in the column will be lost.
  - You are about to drop the column `description_rm` on the `man_cat_label_item` table. All the data in the column will be lost.
  - You are about to drop the column `name_rm` on the `man_cat_label_item` table. All the data in the column will be lost.
  - You are about to drop the column `description_rm` on the `nat_rel_item` table. All the data in the column will be lost.
  - You are about to drop the column `name_rm` on the `nat_rel_item` table. All the data in the column will be lost.
  - You are about to drop the column `description_rm` on the `pub_channel_item` table. All the data in the column will be lost.
  - You are about to drop the column `name_rm` on the `pub_channel_item` table. All the data in the column will be lost.
  - You are about to drop the column `description_rm` on the `status_asset_use_item` table. All the data in the column will be lost.
  - You are about to drop the column `name_rm` on the `status_asset_use_item` table. All the data in the column will be lost.
  - You are about to drop the column `description_rm` on the `status_work_item` table. All the data in the column will be lost.
  - You are about to drop the column `name_rm` on the `status_work_item` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "asset_format_item" DROP COLUMN "description_rm",
DROP COLUMN "name_rm";

-- AlterTable
ALTER TABLE "asset_kind_item" DROP COLUMN "description_rm",
DROP COLUMN "name_rm";

-- AlterTable
ALTER TABLE "auto_cat_label_item" DROP COLUMN "description_rm",
DROP COLUMN "name_rm";

-- AlterTable
ALTER TABLE "auto_object_cat_item" DROP COLUMN "description_rm",
DROP COLUMN "name_rm";

-- AlterTable
ALTER TABLE "contact_kind_item" DROP COLUMN "description_rm",
DROP COLUMN "name_rm";

-- AlterTable
ALTER TABLE "geom_quality_item" DROP COLUMN "description_rm",
DROP COLUMN "name_rm";

-- AlterTable
ALTER TABLE "language_item" DROP COLUMN "description_rm",
DROP COLUMN "name_rm";

-- AlterTable
ALTER TABLE "legal_doc_item" DROP COLUMN "description_rm",
DROP COLUMN "name_rm";

-- AlterTable
ALTER TABLE "man_cat_label_item" DROP COLUMN "description_rm",
DROP COLUMN "name_rm";

-- AlterTable
ALTER TABLE "nat_rel_item" DROP COLUMN "description_rm",
DROP COLUMN "name_rm";

-- AlterTable
ALTER TABLE "pub_channel_item" DROP COLUMN "description_rm",
DROP COLUMN "name_rm";

-- AlterTable
ALTER TABLE "status_asset_use_item" DROP COLUMN "description_rm",
DROP COLUMN "name_rm";

-- AlterTable
ALTER TABLE "status_work_item" DROP COLUMN "description_rm",
DROP COLUMN "name_rm";
