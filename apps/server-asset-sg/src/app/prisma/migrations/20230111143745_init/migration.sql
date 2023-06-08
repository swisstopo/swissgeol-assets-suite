-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateTable
CREATE TABLE "auth"."audit_log_entries" (
    "instance_id" UUID,
    "id" UUID NOT NULL,
    "payload" JSON,
    "created_at" TIMESTAMPTZ(6),
    "ip_address" VARCHAR(64) NOT NULL DEFAULT '',

    CONSTRAINT "audit_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."identities" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "identity_data" JSONB NOT NULL,
    "provider" TEXT NOT NULL,
    "last_sign_in_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "identities_pkey" PRIMARY KEY ("provider","id")
);

-- CreateTable
CREATE TABLE "auth"."instances" (
    "id" UUID NOT NULL,
    "uuid" UUID,
    "raw_base_config" TEXT,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."refresh_tokens" (
    "instance_id" UUID,
    "id" BIGSERIAL NOT NULL,
    "token" VARCHAR(255),
    "user_id" VARCHAR(255),
    "revoked" BOOLEAN,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "parent" VARCHAR(255),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."schema_migrations" (
    "version" VARCHAR(14) NOT NULL
);

-- CreateTable
CREATE TABLE "auth"."users" (
    "instance_id" UUID,
    "id" UUID NOT NULL,
    "aud" VARCHAR(255),
    "role" VARCHAR(255),
    "email" VARCHAR(255),
    "encrypted_password" VARCHAR(255),
    "email_confirmed_at" TIMESTAMPTZ(6),
    "invited_at" TIMESTAMPTZ(6),
    "confirmation_token" VARCHAR(255),
    "confirmation_sent_at" TIMESTAMPTZ(6),
    "recovery_token" VARCHAR(255),
    "recovery_sent_at" TIMESTAMPTZ(6),
    "email_change_token_new" VARCHAR(255),
    "email_change" VARCHAR(255),
    "email_change_sent_at" TIMESTAMPTZ(6),
    "last_sign_in_at" TIMESTAMPTZ(6),
    "raw_app_meta_data" JSONB,
    "raw_user_meta_data" JSONB,
    "is_super_admin" BOOLEAN,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "phone" VARCHAR(15),
    "phone_confirmed_at" TIMESTAMPTZ(6),
    "phone_change" VARCHAR(15) DEFAULT '',
    "phone_change_token" VARCHAR(255) DEFAULT '',
    "phone_change_sent_at" TIMESTAMPTZ(6),
    "confirmed_at" TIMESTAMPTZ(6),
    "email_change_token_current" VARCHAR(255) DEFAULT '',
    "email_change_confirm_status" SMALLINT DEFAULT 0,
    "banned_until" TIMESTAMPTZ(6),
    "reauthentication_token" VARCHAR(255) DEFAULT '',
    "reauthentication_sent_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."asset" (
    "asset_id" SERIAL NOT NULL,
    "title_public" TEXT NOT NULL,
    "title_original" TEXT NOT NULL,
    "is_nat_rel" BOOLEAN NOT NULL,
    "receipt_date" TIMESTAMP(3) NOT NULL,
    "municipality" TEXT,
    "url" TEXT,
    "location_analog" TEXT NOT NULL,
    "processor" TEXT,
    "last_processed_date" TIMESTAMP(3) NOT NULL,
    "text_body" TEXT,
    "sgs_id" INTEGER NOT NULL,
    "geol_data_info" TEXT NOT NULL,
    "geol_contact_data_info" TEXT NOT NULL,
    "geol_aux_data_info" TEXT NOT NULL,
    "remark" TEXT,
    "asset_kind_item_code" TEXT NOT NULL,
    "create_date" TIMESTAMP(3) NOT NULL,
    "language_item_code" TEXT NOT NULL,
    "asset_format_item_code" TEXT NOT NULL,
    "author_biblio_id" TEXT,
    "source_project" TEXT,
    "description" TEXT,
    "is_extract" BOOLEAN NOT NULL,
    "internal_use_id" INTEGER NOT NULL,
    "public_use_id" INTEGER NOT NULL,
    "asset_main_id" INTEGER,

    CONSTRAINT "asset_pkey" PRIMARY KEY ("asset_id")
);

-- CreateTable
CREATE TABLE "public"."id" (
    "id_id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "id_pkey" PRIMARY KEY ("id_id")
);

-- CreateTable
CREATE TABLE "public"."asset_x_asset_y" (
    "asset_x_id" INTEGER NOT NULL,
    "asset_y_id" INTEGER NOT NULL,

    CONSTRAINT "asset_x_asset_y_pkey" PRIMARY KEY ("asset_x_id","asset_y_id")
);

-- CreateTable
CREATE TABLE "public"."internal_use" (
    "internal_use_id" SERIAL NOT NULL,
    "is_available" BOOLEAN NOT NULL,
    "status_asset_use_item_code" TEXT NOT NULL,
    "start_availability_date" TIMESTAMP(3),

    CONSTRAINT "internal_use_pkey" PRIMARY KEY ("internal_use_id")
);

-- CreateTable
CREATE TABLE "public"."public_use" (
    "public_use_id" SERIAL NOT NULL,
    "is_available" BOOLEAN NOT NULL,
    "status_asset_use_item_code" TEXT NOT NULL,
    "start_availability_date" TIMESTAMP(3),

    CONSTRAINT "public_use_pkey" PRIMARY KEY ("public_use_id")
);

-- CreateTable
CREATE TABLE "public"."asset_file" (
    "asset_id" INTEGER NOT NULL,
    "file_id" INTEGER NOT NULL,

    CONSTRAINT "asset_file_pkey" PRIMARY KEY ("asset_id","file_id")
);

-- CreateTable
CREATE TABLE "public"."file" (
    "file_id" SERIAL NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "file_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_pkey" PRIMARY KEY ("file_id")
);

-- CreateTable
CREATE TABLE "public"."asset_object_info" (
    "asset_object_info_id" SERIAL NOT NULL,
    "file_id" INTEGER NOT NULL,
    "auto_object_cat_item_code" TEXT NOT NULL,
    "object_page" TEXT NOT NULL,
    "object_bbox" TEXT NOT NULL,
    "object_score" TEXT NOT NULL,
    "path_to_image" TEXT NOT NULL,

    CONSTRAINT "asset_object_info_pkey" PRIMARY KEY ("asset_object_info_id")
);

-- CreateTable
CREATE TABLE "public"."man_cat_label_ref" (
    "asset_id" INTEGER NOT NULL,
    "man_cat_label_item_code" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "public"."asset_format_composition" (
    "asset_format_composition_id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "asset_format_item_code" TEXT NOT NULL,

    CONSTRAINT "asset_format_composition_pkey" PRIMARY KEY ("asset_format_composition_id")
);

-- CreateTable
CREATE TABLE "public"."asset_kind_composition" (
    "asset_kind_composition_id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "asset_kind_item_code" TEXT NOT NULL,

    CONSTRAINT "asset_kind_composition_pkey" PRIMARY KEY ("asset_kind_composition_id")
);

-- CreateTable
CREATE TABLE "public"."status_work" (
    "status_work_id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "status_work_item_code" TEXT NOT NULL,
    "status_work_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "status_work_pkey" PRIMARY KEY ("status_work_id")
);

-- CreateTable
CREATE TABLE "public"."aut_cat" (
    "auto_cat_id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "auto_cat_label_item_code" TEXT NOT NULL,
    "auto_cat_label_score" INTEGER NOT NULL,

    CONSTRAINT "aut_cat_pkey" PRIMARY KEY ("auto_cat_id")
);

-- CreateTable
CREATE TABLE "public"."type_nat_rel" (
    "type_nat_rel_id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "nat_rel_item_code" TEXT NOT NULL,

    CONSTRAINT "type_nat_rel_pkey" PRIMARY KEY ("type_nat_rel_id")
);

-- CreateTable
CREATE TABLE "public"."legal_doc" (
    "legal_doc_id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "legal_doc_item_code" TEXT NOT NULL,

    CONSTRAINT "legal_doc_pkey" PRIMARY KEY ("legal_doc_id")
);

-- CreateTable
CREATE TABLE "public"."contact" (
    "contact_id" SERIAL NOT NULL,
    "contact_kind_item_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "street" TEXT,
    "house_number" TEXT,
    "plz" TEXT,
    "locality" TEXT,
    "country" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "website" TEXT,

    CONSTRAINT "contact_pkey" PRIMARY KEY ("contact_id")
);

-- CreateTable
CREATE TABLE "public"."asset_contact" (
    "asset_id" INTEGER NOT NULL,
    "contact_id" INTEGER NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "asset_contact_pkey" PRIMARY KEY ("asset_id","contact_id","role")
);

-- CreateTable
CREATE TABLE "public"."publication" (
    "publication_id" SERIAL NOT NULL,
    "pub_channel_item_code" TEXT NOT NULL,
    "publication_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "link" TEXT NOT NULL,

    CONSTRAINT "publication_pkey" PRIMARY KEY ("publication_id")
);

-- CreateTable
CREATE TABLE "public"."asset_publication" (
    "asset_id" INTEGER NOT NULL,
    "publication_id" INTEGER NOT NULL,

    CONSTRAINT "asset_publication_pkey" PRIMARY KEY ("asset_id","publication_id")
);

-- CreateTable
CREATE TABLE "public"."internal_project" (
    "internal_project_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "date_delivered" TEXT NOT NULL,

    CONSTRAINT "internal_project_pkey" PRIMARY KEY ("internal_project_id")
);

-- CreateTable
CREATE TABLE "public"."asset_internal_project" (
    "asset_id" INTEGER NOT NULL,
    "internal_project_id" INTEGER NOT NULL,

    CONSTRAINT "asset_internal_project_pkey" PRIMARY KEY ("asset_id","internal_project_id")
);

-- CreateTable
CREATE TABLE "public"."study_area" (
    "study_area_id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "geom_quality_item_code" TEXT NOT NULL,
    "geom" geometry,

    CONSTRAINT "study_area_pkey" PRIMARY KEY ("study_area_id")
);

-- CreateTable
CREATE TABLE "public"."study_location" (
    "study_location_id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "geom_quality_item_code" TEXT NOT NULL,
    "geom" geometry,

    CONSTRAINT "study_location_pkey" PRIMARY KEY ("study_location_id")
);

-- CreateTable
CREATE TABLE "public"."study_trace" (
    "study_trace_id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "geom_quality_item_code" TEXT NOT NULL,
    "geom" geometry,

    CONSTRAINT "study_trace_pkey" PRIMARY KEY ("study_trace_id")
);

-- CreateTable
CREATE TABLE "public"."asset_format_item" (
    "asset_format_item_code" TEXT NOT NULL,
    "geol_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_de" TEXT NOT NULL,
    "name_fr" TEXT NOT NULL,
    "name_rm" TEXT NOT NULL,
    "name_it" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "description_de" TEXT NOT NULL,
    "description_fr" TEXT NOT NULL,
    "description_rm" TEXT NOT NULL,
    "description_it" TEXT NOT NULL,
    "description_en" TEXT NOT NULL,

    CONSTRAINT "asset_format_item_pkey" PRIMARY KEY ("asset_format_item_code")
);

-- CreateTable
CREATE TABLE "public"."asset_kind_item" (
    "asset_kind_item_code" TEXT NOT NULL,
    "geol_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_de" TEXT NOT NULL,
    "name_fr" TEXT NOT NULL,
    "name_rm" TEXT NOT NULL,
    "name_it" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "description_de" TEXT NOT NULL,
    "description_fr" TEXT NOT NULL,
    "description_rm" TEXT NOT NULL,
    "description_it" TEXT NOT NULL,
    "description_en" TEXT NOT NULL,

    CONSTRAINT "asset_kind_item_pkey" PRIMARY KEY ("asset_kind_item_code")
);

-- CreateTable
CREATE TABLE "public"."auto_cat_label_item" (
    "asset_cat_label_item_code" TEXT NOT NULL,
    "geol_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_de" TEXT NOT NULL,
    "name_fr" TEXT NOT NULL,
    "name_rm" TEXT NOT NULL,
    "name_it" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "description_de" TEXT NOT NULL,
    "description_fr" TEXT NOT NULL,
    "description_rm" TEXT NOT NULL,
    "description_it" TEXT NOT NULL,
    "description_en" TEXT NOT NULL,

    CONSTRAINT "auto_cat_label_item_pkey" PRIMARY KEY ("asset_cat_label_item_code")
);

-- CreateTable
CREATE TABLE "public"."auto_object_cat_item" (
    "auto_object_cat_item_code" TEXT NOT NULL,
    "geol_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_de" TEXT NOT NULL,
    "name_fr" TEXT NOT NULL,
    "name_rm" TEXT NOT NULL,
    "name_it" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "description_de" TEXT NOT NULL,
    "description_fr" TEXT NOT NULL,
    "description_rm" TEXT NOT NULL,
    "description_it" TEXT NOT NULL,
    "description_en" TEXT NOT NULL,

    CONSTRAINT "auto_object_cat_item_pkey" PRIMARY KEY ("auto_object_cat_item_code")
);

-- CreateTable
CREATE TABLE "public"."contact_kind_item" (
    "contact_kind_item_code" TEXT NOT NULL,
    "geol_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_de" TEXT NOT NULL,
    "name_fr" TEXT NOT NULL,
    "name_rm" TEXT NOT NULL,
    "name_it" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "description_de" TEXT NOT NULL,
    "description_fr" TEXT NOT NULL,
    "description_rm" TEXT NOT NULL,
    "description_it" TEXT NOT NULL,
    "description_en" TEXT NOT NULL,

    CONSTRAINT "contact_kind_item_pkey" PRIMARY KEY ("contact_kind_item_code")
);

-- CreateTable
CREATE TABLE "public"."geom_quality_item" (
    "geom_quality_item_code" TEXT NOT NULL,
    "geol_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_de" TEXT NOT NULL,
    "name_fr" TEXT NOT NULL,
    "name_rm" TEXT NOT NULL,
    "name_it" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "description_de" TEXT NOT NULL,
    "description_fr" TEXT NOT NULL,
    "description_rm" TEXT NOT NULL,
    "description_it" TEXT NOT NULL,
    "description_en" TEXT NOT NULL,

    CONSTRAINT "geom_quality_item_pkey" PRIMARY KEY ("geom_quality_item_code")
);

-- CreateTable
CREATE TABLE "public"."language_item" (
    "language_item_code" TEXT NOT NULL,
    "geol_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_de" TEXT NOT NULL,
    "name_fr" TEXT NOT NULL,
    "name_rm" TEXT NOT NULL,
    "name_it" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "description_de" TEXT NOT NULL,
    "description_fr" TEXT NOT NULL,
    "description_rm" TEXT NOT NULL,
    "description_it" TEXT NOT NULL,
    "description_en" TEXT NOT NULL,

    CONSTRAINT "language_item_pkey" PRIMARY KEY ("language_item_code")
);

-- CreateTable
CREATE TABLE "public"."man_cat_label_item" (
    "man_cat_label_item_code" TEXT NOT NULL,
    "geol_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_de" TEXT NOT NULL,
    "name_fr" TEXT NOT NULL,
    "name_rm" TEXT NOT NULL,
    "name_it" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "description_de" TEXT NOT NULL,
    "description_fr" TEXT NOT NULL,
    "description_rm" TEXT NOT NULL,
    "description_it" TEXT NOT NULL,
    "description_en" TEXT NOT NULL,

    CONSTRAINT "man_cat_label_item_pkey" PRIMARY KEY ("man_cat_label_item_code")
);

-- CreateTable
CREATE TABLE "public"."nat_rel_item" (
    "nat_rel_item_code" TEXT NOT NULL,
    "geol_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_de" TEXT NOT NULL,
    "name_fr" TEXT NOT NULL,
    "name_rm" TEXT NOT NULL,
    "name_it" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "description_de" TEXT NOT NULL,
    "description_fr" TEXT NOT NULL,
    "description_rm" TEXT NOT NULL,
    "description_it" TEXT NOT NULL,
    "description_en" TEXT NOT NULL,

    CONSTRAINT "nat_rel_item_pkey" PRIMARY KEY ("nat_rel_item_code")
);

-- CreateTable
CREATE TABLE "public"."legal_doc_item" (
    "legal_doc_item_code" TEXT NOT NULL,
    "geol_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_de" TEXT NOT NULL,
    "name_fr" TEXT NOT NULL,
    "name_rm" TEXT NOT NULL,
    "name_it" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "description_de" TEXT NOT NULL,
    "description_fr" TEXT NOT NULL,
    "description_rm" TEXT NOT NULL,
    "description_it" TEXT NOT NULL,
    "description_en" TEXT NOT NULL,

    CONSTRAINT "legal_doc_item_pkey" PRIMARY KEY ("legal_doc_item_code")
);

-- CreateTable
CREATE TABLE "public"."pub_channel_item" (
    "pub_channel_item_code" TEXT NOT NULL,
    "geol_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_de" TEXT NOT NULL,
    "name_fr" TEXT NOT NULL,
    "name_rm" TEXT NOT NULL,
    "name_it" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "description_de" TEXT NOT NULL,
    "description_fr" TEXT NOT NULL,
    "description_rm" TEXT NOT NULL,
    "description_it" TEXT NOT NULL,
    "description_en" TEXT NOT NULL,

    CONSTRAINT "pub_channel_item_pkey" PRIMARY KEY ("pub_channel_item_code")
);

-- CreateTable
CREATE TABLE "public"."status_asset_use_item" (
    "status_asset_use_item_code" TEXT NOT NULL,
    "geol_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_de" TEXT NOT NULL,
    "name_fr" TEXT NOT NULL,
    "name_rm" TEXT NOT NULL,
    "name_it" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "description_de" TEXT NOT NULL,
    "description_fr" TEXT NOT NULL,
    "description_rm" TEXT NOT NULL,
    "description_it" TEXT NOT NULL,
    "description_en" TEXT NOT NULL,

    CONSTRAINT "status_asset_use_item_pkey" PRIMARY KEY ("status_asset_use_item_code")
);

-- CreateTable
CREATE TABLE "public"."status_work_item" (
    "status_work_item_code" TEXT NOT NULL,
    "geol_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_de" TEXT NOT NULL,
    "name_fr" TEXT NOT NULL,
    "name_rm" TEXT NOT NULL,
    "name_it" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "description_de" TEXT NOT NULL,
    "description_fr" TEXT NOT NULL,
    "description_rm" TEXT NOT NULL,
    "description_it" TEXT NOT NULL,
    "description_en" TEXT NOT NULL,

    CONSTRAINT "status_work_item_pkey" PRIMARY KEY ("status_work_item_code")
);

-- CreateTable
CREATE TABLE "public"."asset_user" (
    "id" UUID NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "asset_user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_instance_id_idx" ON "auth"."audit_log_entries"("instance_id");

-- CreateIndex
CREATE INDEX "identities_user_id_idx" ON "auth"."identities"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_unique" ON "auth"."refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_instance_id_idx" ON "auth"."refresh_tokens"("instance_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_instance_id_user_id_idx" ON "auth"."refresh_tokens"("instance_id", "user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_parent_idx" ON "auth"."refresh_tokens"("parent");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "auth"."refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "schema_migrations_version_idx" ON "auth"."schema_migrations"("version");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "auth"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "auth"."users"("phone");

-- CreateIndex
CREATE INDEX "users_instance_id_idx" ON "auth"."users"("instance_id");

-- CreateIndex
CREATE UNIQUE INDEX "file_file_name_key" ON "public"."file"("file_name");

-- CreateIndex
CREATE UNIQUE INDEX "man_cat_label_ref_asset_id_man_cat_label_item_code_key" ON "public"."man_cat_label_ref"("asset_id", "man_cat_label_item_code");

-- CreateIndex
CREATE INDEX "study_area_geom_idx" ON "public"."study_area" USING GIST ("geom");

-- CreateIndex
CREATE INDEX "study_location_geom_idx" ON "public"."study_location" USING GIST ("geom");

-- CreateIndex
CREATE INDEX "study_trace_geom_idx" ON "public"."study_trace" USING GIST ("geom");

-- AddForeignKey
ALTER TABLE "auth"."identities" ADD CONSTRAINT "identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_parent_fkey" FOREIGN KEY ("parent") REFERENCES "auth"."refresh_tokens"("token") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."asset" ADD CONSTRAINT "asset_asset_kind_item_code_fkey" FOREIGN KEY ("asset_kind_item_code") REFERENCES "public"."asset_kind_item"("asset_kind_item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset" ADD CONSTRAINT "asset_language_item_code_fkey" FOREIGN KEY ("language_item_code") REFERENCES "public"."language_item"("language_item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset" ADD CONSTRAINT "asset_asset_format_item_code_fkey" FOREIGN KEY ("asset_format_item_code") REFERENCES "public"."asset_format_item"("asset_format_item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset" ADD CONSTRAINT "asset_internal_use_id_fkey" FOREIGN KEY ("internal_use_id") REFERENCES "public"."internal_use"("internal_use_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset" ADD CONSTRAINT "asset_public_use_id_fkey" FOREIGN KEY ("public_use_id") REFERENCES "public"."public_use"("public_use_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset" ADD CONSTRAINT "asset_asset_main_id_fkey" FOREIGN KEY ("asset_main_id") REFERENCES "public"."asset"("asset_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."id" ADD CONSTRAINT "id_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_x_asset_y" ADD CONSTRAINT "asset_x_asset_y_asset_x_id_fkey" FOREIGN KEY ("asset_x_id") REFERENCES "public"."asset"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_x_asset_y" ADD CONSTRAINT "asset_x_asset_y_asset_y_id_fkey" FOREIGN KEY ("asset_y_id") REFERENCES "public"."asset"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."internal_use" ADD CONSTRAINT "internal_use_status_asset_use_item_code_fkey" FOREIGN KEY ("status_asset_use_item_code") REFERENCES "public"."status_asset_use_item"("status_asset_use_item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."public_use" ADD CONSTRAINT "public_use_status_asset_use_item_code_fkey" FOREIGN KEY ("status_asset_use_item_code") REFERENCES "public"."status_asset_use_item"("status_asset_use_item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_file" ADD CONSTRAINT "asset_file_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_file" ADD CONSTRAINT "asset_file_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "public"."file"("file_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_object_info" ADD CONSTRAINT "asset_object_info_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "public"."file"("file_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_object_info" ADD CONSTRAINT "asset_object_info_auto_object_cat_item_code_fkey" FOREIGN KEY ("auto_object_cat_item_code") REFERENCES "public"."auto_object_cat_item"("auto_object_cat_item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."man_cat_label_ref" ADD CONSTRAINT "man_cat_label_ref_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."man_cat_label_ref" ADD CONSTRAINT "man_cat_label_ref_man_cat_label_item_code_fkey" FOREIGN KEY ("man_cat_label_item_code") REFERENCES "public"."man_cat_label_item"("man_cat_label_item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_format_composition" ADD CONSTRAINT "asset_format_composition_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_format_composition" ADD CONSTRAINT "asset_format_composition_asset_format_item_code_fkey" FOREIGN KEY ("asset_format_item_code") REFERENCES "public"."asset_format_item"("asset_format_item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_kind_composition" ADD CONSTRAINT "asset_kind_composition_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_kind_composition" ADD CONSTRAINT "asset_kind_composition_asset_kind_item_code_fkey" FOREIGN KEY ("asset_kind_item_code") REFERENCES "public"."asset_kind_item"("asset_kind_item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."status_work" ADD CONSTRAINT "status_work_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."status_work" ADD CONSTRAINT "status_work_status_work_item_code_fkey" FOREIGN KEY ("status_work_item_code") REFERENCES "public"."status_work_item"("status_work_item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."aut_cat" ADD CONSTRAINT "aut_cat_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."aut_cat" ADD CONSTRAINT "aut_cat_auto_cat_label_item_code_fkey" FOREIGN KEY ("auto_cat_label_item_code") REFERENCES "public"."auto_cat_label_item"("asset_cat_label_item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."type_nat_rel" ADD CONSTRAINT "type_nat_rel_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."type_nat_rel" ADD CONSTRAINT "type_nat_rel_nat_rel_item_code_fkey" FOREIGN KEY ("nat_rel_item_code") REFERENCES "public"."nat_rel_item"("nat_rel_item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."legal_doc" ADD CONSTRAINT "legal_doc_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."legal_doc" ADD CONSTRAINT "legal_doc_legal_doc_item_code_fkey" FOREIGN KEY ("legal_doc_item_code") REFERENCES "public"."legal_doc_item"("legal_doc_item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contact" ADD CONSTRAINT "contact_contact_kind_item_code_fkey" FOREIGN KEY ("contact_kind_item_code") REFERENCES "public"."contact_kind_item"("contact_kind_item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_contact" ADD CONSTRAINT "asset_contact_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_contact" ADD CONSTRAINT "asset_contact_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contact"("contact_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."publication" ADD CONSTRAINT "publication_pub_channel_item_code_fkey" FOREIGN KEY ("pub_channel_item_code") REFERENCES "public"."pub_channel_item"("pub_channel_item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_publication" ADD CONSTRAINT "asset_publication_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_publication" ADD CONSTRAINT "asset_publication_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "public"."publication"("publication_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_internal_project" ADD CONSTRAINT "asset_internal_project_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_internal_project" ADD CONSTRAINT "asset_internal_project_internal_project_id_fkey" FOREIGN KEY ("internal_project_id") REFERENCES "public"."internal_project"("internal_project_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."study_area" ADD CONSTRAINT "study_area_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."study_area" ADD CONSTRAINT "study_area_geom_quality_item_code_fkey" FOREIGN KEY ("geom_quality_item_code") REFERENCES "public"."geom_quality_item"("geom_quality_item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."study_location" ADD CONSTRAINT "study_location_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."study_location" ADD CONSTRAINT "study_location_geom_quality_item_code_fkey" FOREIGN KEY ("geom_quality_item_code") REFERENCES "public"."geom_quality_item"("geom_quality_item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."study_trace" ADD CONSTRAINT "study_trace_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."study_trace" ADD CONSTRAINT "study_trace_geom_quality_item_code_fkey" FOREIGN KEY ("geom_quality_item_code") REFERENCES "public"."geom_quality_item"("geom_quality_item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_user" ADD CONSTRAINT "asset_user_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
