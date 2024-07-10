/*
  Warnings:

  - You are about to drop the column `role` on the `asset_user` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('viewer', 'editor', 'master-editor');

-- AlterTable
ALTER TABLE "asset" ADD COLUMN "workgroup_id" INTEGER;


-- CreateTable
CREATE TABLE "workgroup" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL,
  "disabled_at" TIMESTAMPTZ(6),

  CONSTRAINT "workgroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workgroups_on_users" (
  "workgroup_id" INTEGER NOT NULL,
  "user_id" UUID NOT NULL,
  "role" "Role" NOT NULL,

  CONSTRAINT "workgroups_on_users_pkey" PRIMARY KEY ("workgroup_id","user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workgroup_name_key" ON "workgroup"("name");

-- AddForeignKey
ALTER TABLE "asset" ADD CONSTRAINT "asset_workgroup_id_fkey" FOREIGN KEY ("workgroup_id") REFERENCES "workgroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workgroups_on_users" ADD CONSTRAINT "workgroups_on_users_workgroup_id_fkey" FOREIGN KEY ("workgroup_id") REFERENCES "workgroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workgroups_on_users" ADD CONSTRAINT "workgroups_on_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "asset_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "workgroup" ("name", "created_at")
VALUES ('Swisstopo', NOW());

DO
$$
    DECLARE
swisstopo_id INTEGER;
BEGIN
SELECT "id" INTO swisstopo_id FROM "workgroup" WHERE name = 'Swisstopo';

-- Update all assets to be assigned to the "Swisstopo" workgroup
UPDATE "asset" SET "workgroup_id" = swisstopo_id;

-- Assign all users to the "Swisstopo" workgroup with role "VIEWER"
INSERT INTO "workgroups_on_users" ("workgroup_id", "user_id", "role")
SELECT
  swisstopo_id,
  "id",
  CASE
    WHEN "asset_user"."role" = 'admin' THEN 'master-editor'::"Role"
    WHEN "asset_user"."role" = 'editor' THEN 'editor'::"Role"
    WHEN "asset_user"."role" = 'viewer' THEN 'viewer'::"Role"
    WHEN "asset_user"."role" = 'master-editor' THEN 'master-editor'::"Role"
    ELSE 'viewer'::"Role"
  END
  FROM "asset_user";
END
$$;

-- AlterTable
ALTER TABLE "asset_user" ADD COLUMN "is_admin" BOOLEAN NOT NULL DEFAULT false;

UPDATE "asset_user" SET "is_admin" = true WHERE role = 'admin';

ALTER TABLE "asset_user" ALTER COLUMN "is_admin" SET NOT NULL;
ALTER TABLE "asset_user" DROP COLUMN "role";
