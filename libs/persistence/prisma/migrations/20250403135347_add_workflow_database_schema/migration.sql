/*
  Warnings:

  - Made the column `role` on table `workgroups_on_users` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "workflow_status" AS ENUM ('Draft', 'InReview', 'Reviewed', 'Published');

-- AlterTable
ALTER TABLE "asset"
  ADD COLUMN "creator_id" UUID;

-- AlterTable
ALTER TABLE "workgroups_on_users"
  ALTER COLUMN "role" SET NOT NULL;

-- CreateTable
CREATE TABLE "workflow"
(
  "workflow_id"           SERIAL            NOT NULL,
  "has_requested_changes" BOOLEAN           NOT NULL DEFAULT false,
  "status"                "workflow_status" NOT NULL DEFAULT 'Draft',
  "asset_id"              INTEGER           NOT NULL,
  "reviewed_tabs_id"      INTEGER           NOT NULL,
  "published_tabs_id"     INTEGER           NOT NULL,
  "assignee_id"           UUID,

  CONSTRAINT "workflow_pkey" PRIMARY KEY ("workflow_id")
);

-- CreateTable
CREATE TABLE "workflow_change"
(
  "workflow_change_id" SERIAL            NOT NULL,
  "comment"            TEXT,
  "created_at"         TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "from_status"        "workflow_status" NOT NULL,
  "to_status"          "workflow_status" NOT NULL,
  "from_assignee_id"   UUID,
  "to_assignee_id"     UUID,
  "workflow_id"        INTEGER           NOT NULL,
  "creator_id"         UUID,

  CONSTRAINT "workflow_change_pkey" PRIMARY KEY ("workflow_change_id")
);

-- CreateTable
CREATE TABLE "tab_status"
(
  "tab_status_id" SERIAL  NOT NULL,
  "general"       BOOLEAN NOT NULL DEFAULT false,
  "files"         BOOLEAN NOT NULL DEFAULT false,
  "usage"         BOOLEAN NOT NULL DEFAULT false,
  "contacts"      BOOLEAN NOT NULL DEFAULT false,
  "references"    BOOLEAN NOT NULL DEFAULT false,
  "geometries"    BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "tab_status_pkey" PRIMARY KEY ("tab_status_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workflow_asset_id_key" ON "workflow" ("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_reviewed_tabs_id_key" ON "workflow" ("reviewed_tabs_id");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_published_tabs_id_key" ON "workflow" ("published_tabs_id");

-- AddForeignKey
ALTER TABLE "asset"
  ADD CONSTRAINT "asset_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "asset_user" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"
  ADD CONSTRAINT "workflow_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset" ("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"
  ADD CONSTRAINT "workflow_reviewed_tabs_id_fkey" FOREIGN KEY ("reviewed_tabs_id") REFERENCES "tab_status" ("tab_status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"
  ADD CONSTRAINT "workflow_published_tabs_id_fkey" FOREIGN KEY ("published_tabs_id") REFERENCES "tab_status" ("tab_status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"
  ADD CONSTRAINT "workflow_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "asset_user" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_change"
  ADD CONSTRAINT "workflow_change_from_assignee_id_fkey" FOREIGN KEY ("from_assignee_id") REFERENCES "asset_user" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_change"
  ADD CONSTRAINT "workflow_change_to_assignee_id_fkey" FOREIGN KEY ("to_assignee_id") REFERENCES "asset_user" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_change"
  ADD CONSTRAINT "workflow_change_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflow" ("workflow_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_change"
  ADD CONSTRAINT "workflow_change_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "asset_user" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- add default data
DO
$$
  DECLARE
    asset_cursor CURSOR FOR SELECT asset_id
                            FROM asset;
    v_asset_id                asset.asset_id%TYPE;
    v_tab_status_reviewed_id  tab_status.tab_status_id%TYPE;
    v_tab_status_published_id tab_status.tab_status_id%TYPE;
  BEGIN
    -- Loop through each asset
    FOR asset_record IN asset_cursor
      LOOP
        -- Insert into tab_status and capture the generated IDs
        INSERT INTO tab_status DEFAULT
        VALUES
        RETURNING tab_status_id INTO v_tab_status_reviewed_id;

        INSERT INTO tab_status DEFAULT
        VALUES
        RETURNING tab_status_id INTO v_tab_status_published_id;

        -- Now insert into workflow table with asset_id and the two tab_status IDs
        v_asset_id := asset_record.asset_id;
        INSERT INTO workflow (asset_id, reviewed_tabs_id, published_tabs_id, status)
        VALUES (v_asset_id, v_tab_status_reviewed_id, v_tab_status_published_id, 'Published'::workflow_status);
      END LOOP;
  END;
$$;
