-- DropForeignKey
ALTER TABLE "asset_contact" DROP CONSTRAINT "asset_contact_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_file" DROP CONSTRAINT "asset_file_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_format_composition" DROP CONSTRAINT "asset_format_composition_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_internal_project" DROP CONSTRAINT "asset_internal_project_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_kind_composition" DROP CONSTRAINT "asset_kind_composition_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_language" DROP CONSTRAINT "asset_language_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_publication" DROP CONSTRAINT "asset_publication_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_user_favourite" DROP CONSTRAINT "asset_user_favourite_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_user_favourite" DROP CONSTRAINT "asset_user_favourite_asset_user_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_x_asset_y" DROP CONSTRAINT "asset_x_asset_y_asset_x_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_x_asset_y" DROP CONSTRAINT "asset_x_asset_y_asset_y_id_fkey";

-- DropForeignKey
ALTER TABLE "auto_cat" DROP CONSTRAINT "auto_cat_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "id" DROP CONSTRAINT "id_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "man_cat_label_ref" DROP CONSTRAINT "man_cat_label_ref_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "status_work" DROP CONSTRAINT "status_work_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "study_area" DROP CONSTRAINT "study_area_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "study_location" DROP CONSTRAINT "study_location_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "study_trace" DROP CONSTRAINT "study_trace_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "type_nat_rel" DROP CONSTRAINT "type_nat_rel_asset_id_fkey";

-- AddForeignKey
ALTER TABLE "id" ADD CONSTRAINT "id_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_x_asset_y" ADD CONSTRAINT "asset_x_asset_y_asset_x_id_fkey" FOREIGN KEY ("asset_x_id") REFERENCES "asset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_x_asset_y" ADD CONSTRAINT "asset_x_asset_y_asset_y_id_fkey" FOREIGN KEY ("asset_y_id") REFERENCES "asset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_file" ADD CONSTRAINT "asset_file_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "man_cat_label_ref" ADD CONSTRAINT "man_cat_label_ref_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_format_composition" ADD CONSTRAINT "asset_format_composition_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_kind_composition" ADD CONSTRAINT "asset_kind_composition_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_work" ADD CONSTRAINT "status_work_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto_cat" ADD CONSTRAINT "auto_cat_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "type_nat_rel" ADD CONSTRAINT "type_nat_rel_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_contact" ADD CONSTRAINT "asset_contact_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_publication" ADD CONSTRAINT "asset_publication_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_internal_project" ADD CONSTRAINT "asset_internal_project_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_area" ADD CONSTRAINT "study_area_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_location" ADD CONSTRAINT "study_location_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_trace" ADD CONSTRAINT "study_trace_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_language" ADD CONSTRAINT "asset_language_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_user_favourite" ADD CONSTRAINT "asset_user_favourite_asset_user_id_fkey" FOREIGN KEY ("asset_user_id") REFERENCES "asset_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_user_favourite" ADD CONSTRAINT "asset_user_favourite_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;
