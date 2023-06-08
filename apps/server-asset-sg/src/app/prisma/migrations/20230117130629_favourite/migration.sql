-- CreateTable
CREATE TABLE "public"."asset_user_favourite" (
    "asset_user_id" UUID NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "asset_user_favourite_pkey" PRIMARY KEY ("asset_user_id","asset_id")
);

-- AddForeignKey
ALTER TABLE "public"."asset_user_favourite" ADD CONSTRAINT "asset_user_favourite_asset_user_id_fkey" FOREIGN KEY ("asset_user_id") REFERENCES "public"."asset_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_user_favourite" ADD CONSTRAINT "asset_user_favourite_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;
