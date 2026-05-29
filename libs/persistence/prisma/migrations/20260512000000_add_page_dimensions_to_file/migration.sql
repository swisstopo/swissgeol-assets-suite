-- Add page_dimensions column to file table
-- Stores per-page dimensions extracted lazily from PDF files
ALTER TABLE "file" ADD COLUMN "page_dimensions" JSONB;

