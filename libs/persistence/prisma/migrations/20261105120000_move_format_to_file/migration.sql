/*
  Warnings:

  - You are about to drop the column `asset_format_item_code` on the `asset` table. The existing values are moved to the new `file.asset_format_item_code` column first.

*/
-- SONAR-OFF

BEGIN;

INSERT INTO "asset_format_item" ("asset_format_item_code", "geol_code", "name", "name_de", "name_fr", "name_it", "name_en", "description", "description_de", "description_fr", "description_it", "description_en")
VALUES ('spreadsheet', 'No-GeolCode-specified', 'Spreadsheet', 'Tabellenformat', 'Format de tableur', 'Formato foglio di calcolo', 'Spreadsheet format', 'Spreadsheet format, such as xls, xlsx, etc.', 'Tabellenformat, wie z.B. xls, xlsx, etc.', 'Format de tableur, p. ex. xls, xlsx, etc.', 'Formato foglio di calcolo, come ad esempio xls, xlsx, ecc.', 'Spreadsheet format, such as xls, xlsx, etc.'),
       ('presentation', 'No-GeolCode-specified', 'Presentation', 'Präsentationsformat', 'Format de présentation', 'Formato di presentazione', 'Presentation format', 'Presentation format, such as pptx, etc.', 'Präsentationsformat, wie z.B. pptx, etc.', 'Format de présentation, p. ex. pptx, etc.', 'Formato di presentazione, come ad esempio pptx, ecc.', 'Presentation format, such as pptx, etc.')
ON CONFLICT ("asset_format_item_code") DO NOTHING;

ALTER TABLE "file" ADD COLUMN "asset_format_item_code" TEXT;

-- Keep this mapping in sync with ASSET_FORMAT_EXTENSIONS in
-- libs/shared/v2/src/lib/models/asset-format.ts.
WITH "file_extension_format" AS (
  SELECT
    f."id",
    f."asset_id",
    f."legal_doc_item_code" IS NOT NULL AS "is_legal",
    CASE lower(substring(f."file_name" from '\.([^.]+)$'))
      WHEN 'pdf' THEN 'pdf'
      WHEN 'shp' THEN 'GISFormat'
      WHEN 'shx' THEN 'GISFormat'
      WHEN 'dbf' THEN 'GISFormat'
      WHEN 'prj' THEN 'GISFormat'
      WHEN 'cpg' THEN 'GISFormat'
      WHEN 'sbn' THEN 'GISFormat'
      WHEN 'sbx' THEN 'GISFormat'
      WHEN 'gpkg' THEN 'GISFormat'
      WHEN 'qml' THEN 'GISFormat'
      WHEN 'qmd' THEN 'GISFormat'
      WHEN 'qix' THEN 'GISFormat'
      WHEN 'tfw' THEN 'GISFormat'
      WHEN 'segy' THEN 'segy'
      WHEN 'sgy' THEN 'segy'
      WHEN 'las' THEN 'las'
      WHEN 'sqlite' THEN 'db'
      WHEN 'db' THEN 'db'
      WHEN 'sqlite3' THEN 'db'
      WHEN 'accdb' THEN 'db'
      WHEN 'mdb' THEN 'db'
      WHEN 'sql' THEN 'db'
      WHEN 'csv' THEN 'db'
      WHEN 'doc' THEN 'textDigital'
      WHEN 'docx' THEN 'textDigital'
      WHEN 'txt' THEN 'textDigital'
      WHEN 'odt' THEN 'textDigital'
      WHEN 'rtf' THEN 'textDigital'
      WHEN 'md' THEN 'textDigital'
      WHEN 'jpg' THEN 'graphicRaster'
      WHEN 'jpeg' THEN 'graphicRaster'
      WHEN 'tif' THEN 'graphicRaster'
      WHEN 'tiff' THEN 'graphicRaster'
      WHEN 'png' THEN 'graphicRaster'
      WHEN 'webp' THEN 'graphicRaster'
      WHEN 'gif' THEN 'graphicRaster'
      WHEN 'ai' THEN 'graphicVector'
      WHEN 'svg' THEN 'graphicVector'
      WHEN 'cdr' THEN 'graphicVector'
      WHEN 'eps' THEN 'graphicVector'
      WHEN 'mp4' THEN 'multimedia'
      WHEN 'mkv' THEN 'multimedia'
      WHEN 'mov' THEN 'multimedia'
      WHEN 'avi' THEN 'multimedia'
      WHEN 'webm' THEN 'multimedia'
      WHEN 'zip' THEN 'archive'
      WHEN 'rar' THEN 'archive'
      WHEN '7z' THEN 'archive'
      WHEN 'xls' THEN 'spreadsheet'
      WHEN 'xlsx' THEN 'spreadsheet'
      WHEN 'pptx' THEN 'presentation'
      WHEN 'off' THEN '3D'
      WHEN '3dx' THEN '3D'
      WHEN 'move' THEN '3D'
      WHEN 'movz' THEN '3D'
      ELSE 'other'
      END AS "format_code"
  FROM "file" f
),
     "assets_with_format_match" AS (
       SELECT DISTINCT e."asset_id"
       FROM "file_extension_format" e
              JOIN "asset" a ON a."asset_id" = e."asset_id"
       WHERE NOT e."is_legal"
         AND e."format_code" = a."asset_format_item_code"
     )
-- Preserve an unmatched legacy format on the asset's non-legal files.
UPDATE "file" f
SET "asset_format_item_code" = CASE
                                 WHEN NOT e."is_legal"
                                   AND a."asset_format_item_code" <> 'other'
                                   AND m."asset_id" IS NULL
                                   THEN a."asset_format_item_code"
                                 ELSE e."format_code"
  END
  FROM "file_extension_format" e
JOIN "asset" a ON a."asset_id" = e."asset_id"
  LEFT JOIN "assets_with_format_match" m ON m."asset_id" = e."asset_id"
WHERE f."id" = e."id";

ALTER TABLE "file" ALTER COLUMN "asset_format_item_code" SET NOT NULL;

ALTER TABLE "file"
  ADD CONSTRAINT "file_asset_format_item_code_fkey"
    FOREIGN KEY ("asset_format_item_code")
      REFERENCES "asset_format_item"("asset_format_item_code")
      ON DELETE RESTRICT
      ON UPDATE CASCADE;

ALTER TABLE "asset" DROP CONSTRAINT "asset_asset_format_item_code_fkey";
ALTER TABLE "asset" DROP COLUMN "asset_format_item_code";

COMMIT;

-- SONAR-ON
