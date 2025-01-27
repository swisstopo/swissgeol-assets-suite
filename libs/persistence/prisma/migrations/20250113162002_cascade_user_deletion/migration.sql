-- DropForeignKey
ALTER TABLE "favorite" DROP CONSTRAINT "favorite_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "workgroups_on_users" DROP CONSTRAINT "workgroups_on_users_user_id_fkey";

-- DropForeignKey
ALTER TABLE "workgroups_on_users" DROP CONSTRAINT "workgroups_on_users_workgroup_id_fkey";

-- AddForeignKey
ALTER TABLE "workgroups_on_users" ADD CONSTRAINT "workgroups_on_users_workgroup_id_fkey" FOREIGN KEY ("workgroup_id") REFERENCES "workgroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workgroups_on_users" ADD CONSTRAINT "workgroups_on_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "asset_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;
