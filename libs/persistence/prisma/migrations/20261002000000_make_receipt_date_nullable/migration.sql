-- Receipt date is unknown for some assets.
ALTER TABLE "asset" ALTER COLUMN "receipt_date" DROP NOT NULL;
