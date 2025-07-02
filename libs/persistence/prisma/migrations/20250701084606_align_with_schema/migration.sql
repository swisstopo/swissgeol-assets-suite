/*
  Warnings:

  - Made the column `role` on table `workgroups_on_users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "workgroups_on_users" ALTER COLUMN "role" SET NOT NULL;

-- RenameForeignKey
ALTER TABLE "workflow" RENAME CONSTRAINT "workflow_asset_id_fkey" TO "workflow_id_fkey";
