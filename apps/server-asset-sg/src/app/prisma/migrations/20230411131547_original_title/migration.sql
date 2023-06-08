-- DropForeignKey
ALTER TABLE "public"."asset_file" DROP CONSTRAINT "asset_file_file_id_fkey";

-- AlterTable
ALTER TABLE "public"."asset" ALTER COLUMN "title_original" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."status_work" ADD COLUMN     "processor" TEXT;

-- AddForeignKey
ALTER TABLE "public"."asset_file" ADD CONSTRAINT "asset_file_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "public"."file"("file_id") ON DELETE CASCADE ON UPDATE CASCADE;
