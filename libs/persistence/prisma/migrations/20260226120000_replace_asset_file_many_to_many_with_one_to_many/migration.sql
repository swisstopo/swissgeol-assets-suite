-- Replace the many-to-many relationship between Asset and File (via the asset_file join table)
-- with a direct one-to-many relationship: each File belongs to exactly one Asset.

-- Step 1: Add the asset_id column to the file table (nullable initially for migration)
ALTER TABLE "file" ADD COLUMN "asset_id" INTEGER;

-- Step 2: Populate asset_id from the existing asset_file join table.
-- For each file, pick one asset (MIN in case of duplicates – though duplicates should not exist).
UPDATE "file" f
SET "asset_id" = af."asset_id"
FROM (
    SELECT DISTINCT ON ("file_id") "file_id", "asset_id"
    FROM "asset_file"
    ORDER BY "file_id", "asset_id"
) af
WHERE f."id" = af."file_id";

-- Step 3: Delete any orphaned files that are not linked to any asset.
DELETE FROM "file" WHERE "asset_id" IS NULL;

-- Step 4: Make asset_id NOT NULL now that all files have an asset.
ALTER TABLE "file" ALTER COLUMN "asset_id" SET NOT NULL;

-- Step 5: Add foreign key constraint with CASCADE delete.
ALTER TABLE "file" ADD CONSTRAINT "file_asset_id_fkey"
    FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 6: Drop the asset_file join table.
DROP TABLE "asset_file";

