-- DropIndex
DROP INDEX "file_name_key";

-- AlterTable
ALTER TABLE "file" RENAME COLUMN "name" TO "file_name";
ALTER TABLE "file"
  ADD COLUMN "file_name_alias" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "file_file_name_key" ON "file" ("file_name");

-- Copy all values that are prefixed with their asset identifier into alias for the original filename.
UPDATE "file"
SET file_name_alias = REGEXP_REPLACE(file_name, '^a[0-9]+_', '')
WHERE file_name ~ '^a[0-9]+_';
