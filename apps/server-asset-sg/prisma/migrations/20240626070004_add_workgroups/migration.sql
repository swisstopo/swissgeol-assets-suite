-- CreateEnum
CREATE TYPE "Role" AS ENUM ('VIEWER', 'EDITOR', 'MASTER_EDITOR', 'ADMIN');

-- AlterTable
ALTER TABLE "asset" ADD COLUMN     "workgroup_id" INTEGER;

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

-- AddForeignKey
ALTER TABLE "asset" ADD CONSTRAINT "asset_workgroup_id_fkey" FOREIGN KEY ("workgroup_id") REFERENCES "workgroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workgroups_on_users" ADD CONSTRAINT "workgroups_on_users_workgroup_id_fkey" FOREIGN KEY ("workgroup_id") REFERENCES "workgroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workgroups_on_users" ADD CONSTRAINT "workgroups_on_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "asset_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
