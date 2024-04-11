/*
  Warnings:

  - Added the required column `email` to the `asset_user` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lang` to the `asset_user` table without a default value. This is not possible if the table is not empty.
  - Added the required column `oidcId` to the `asset_user` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."asset_user" DROP CONSTRAINT "asset_user_id_fkey";

-- AlterTable
ALTER TABLE "auth"."users" ALTER COLUMN "confirmed_at" DROP EXPRESSION;

-- AlterTable
DELETE FROM "public"."asset_user";
ALTER TABLE "public"."asset_user" ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "lang" TEXT NOT NULL,
ADD COLUMN     "oidcId" TEXT NOT NULL;
