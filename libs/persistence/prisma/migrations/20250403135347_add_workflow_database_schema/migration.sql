/*
  Warnings:

  - Made the column `role` on table `workgroups_on_users` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "workflow_status" AS ENUM ('Draft', 'InReview', 'Reviewed', 'Published');

-- AlterTable
ALTER TABLE "asset" ADD COLUMN     "creator_id" UUID;

-- AlterTable
ALTER TABLE "workgroups_on_users" ALTER COLUMN "role" SET NOT NULL;

-- CreateTable
CREATE TABLE "workflow" (
    "id" INTEGER NOT NULL,
    "has_requested_changes" BOOLEAN NOT NULL DEFAULT false,
    "status" "workflow_status" NOT NULL DEFAULT 'Draft',
    "review_id" INTEGER NOT NULL,
    "approval_id" INTEGER NOT NULL,
    "assignee_id" UUID,

    CONSTRAINT "workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_change" (
    "id" SERIAL NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "from_status" "workflow_status" NOT NULL,
    "to_status" "workflow_status" NOT NULL,
    "from_assignee_id" UUID,
    "to_assignee_id" UUID,
    "workflow_id" INTEGER NOT NULL,
    "creator_id" UUID,

    CONSTRAINT "workflow_change_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_selection" (
    "id" SERIAL NOT NULL,
    "general" BOOLEAN NOT NULL DEFAULT false,
    "normal_files" BOOLEAN NOT NULL DEFAULT false,
    "legal_files" BOOLEAN NOT NULL DEFAULT false,
    "authors" BOOLEAN NOT NULL DEFAULT false,
    "initiators" BOOLEAN NOT NULL DEFAULT false,
    "suppliers" BOOLEAN NOT NULL DEFAULT false,
    "references" BOOLEAN NOT NULL DEFAULT false,
    "geometries" BOOLEAN NOT NULL DEFAULT false,
    "legacy" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "workflow_selection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workflow_review_id_key" ON "workflow"("review_id");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_approval_id_key" ON "workflow"("approval_id");

-- AddForeignKey
ALTER TABLE "asset" ADD CONSTRAINT "asset_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "asset_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow" ADD CONSTRAINT "workflow_asset_id_fkey" FOREIGN KEY ("id") REFERENCES "asset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow" ADD CONSTRAINT "workflow_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "workflow_selection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow" ADD CONSTRAINT "workflow_approval_id_fkey" FOREIGN KEY ("approval_id") REFERENCES "workflow_selection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow" ADD CONSTRAINT "workflow_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "asset_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_change" ADD CONSTRAINT "workflow_change_from_assignee_id_fkey" FOREIGN KEY ("from_assignee_id") REFERENCES "asset_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_change" ADD CONSTRAINT "workflow_change_to_assignee_id_fkey" FOREIGN KEY ("to_assignee_id") REFERENCES "asset_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_change" ADD CONSTRAINT "workflow_change_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_change" ADD CONSTRAINT "workflow_change_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "asset_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- add default data
DO
$$
  DECLARE
asset_cursor CURSOR FOR SELECT asset_id
                        FROM asset;
    v_asset_id    asset.asset_id%TYPE;
    v_review_id   workflow_selection.id%TYPE;
    v_approval_id workflow_selection.id%TYPE;
BEGIN
    -- Loop through each asset
FOR asset_record IN asset_cursor
LOOP
        -- Insert into tab_status and capture the generated IDs
        INSERT INTO workflow_selection DEFAULT
        VALUES
        RETURNING id INTO v_review_id;

        INSERT INTO workflow_selection DEFAULT
        VALUES
          RETURNING id INTO v_approval_id;

-- Now insert into workflow table with asset_id and the two tab_status IDs
v_asset_id := asset_record.asset_id;
INSERT INTO workflow (id, review_id, approval_id, status)
VALUES (v_asset_id, v_review_id, v_approval_id, 'Published'::workflow_status);
END LOOP;
END;
$$;
