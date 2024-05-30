-- AlterTable
ALTER TABLE "public"."asset" ALTER COLUMN "sgs_id" DROP NOT NULL,
ALTER COLUMN "geol_data_info" DROP NOT NULL,
ALTER COLUMN "geol_contact_data_info" DROP NOT NULL,
ALTER COLUMN "geol_aux_data_info" DROP NOT NULL;
