-- Cleanup workgroup migration.
ALTER TABLE "asset" DROP CONSTRAINT "asset_workgroup_id_fkey";
ALTER TABLE "asset" ADD CONSTRAINT "asset_workgroup_id_fkey" FOREIGN KEY ("workgroup_id") REFERENCES "workgroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "asset" ALTER COLUMN "workgroup_id" SET NOT NULL;

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('normal', 'legal');

-- AlterTable
ALTER TABLE "file" RENAME COLUMN "file_id" TO "id";
ALTER TABLE "file" RENAME COLUMN "file_date" TO "last_modified_at";
ALTER TABLE "file" RENAME COLUMN "file_name" TO "name";
ALTER TABLE "file" RENAME COLUMN "file_size" TO "size";

ALTER TABLE "file"
    ADD COLUMN     "legal_doc_item_code" TEXT,
    ADD COLUMN     "type" "FileType" NOT NULL DEFAULT 'normal';

-- DropTable
DROP TABLE "legal_doc";

-- CreateIndex
CREATE INDEX "file_type_idx" ON "file"("type");

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_legal_doc_item_code_fkey" FOREIGN KEY ("legal_doc_item_code") REFERENCES "legal_doc_item"("legal_doc_item_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "file_file_name_key" RENAME TO "file_name_key";

-- Mark legal files.
UPDATE "file"
    SET
        "type" = 'legal',
        "legal_doc_item_code" = 'permissionForm'
    WHERE
        LOWER("name") LIKE '%_ldoc.pdf';
