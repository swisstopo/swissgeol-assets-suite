-- Rename page_classifications to page_range_classifications
ALTER TABLE "file"
RENAME COLUMN   "page_classifications" TO  "page_range_classifications";
