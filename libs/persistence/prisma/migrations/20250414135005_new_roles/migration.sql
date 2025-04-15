-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('Reader', 'Editor', 'Reviewer', 'Publisher');
ALTER TABLE "workgroups_on_users" ADD COLUMN "role_new" "Role_new";

UPDATE "workgroups_on_users"
SET role_new = 'Reader'
WHERE role = 'viewer';

UPDATE "workgroups_on_users"
SET role_new = 'Editor'
WHERE role = 'editor';

UPDATE "workgroups_on_users"
SET role_new = 'Publisher'
WHERE role = 'master-editor';

ALTER TABLE "workgroups_on_users" DROP COLUMN "role";
ALTER TABLE "workgroups_on_users" RENAME COLUMN "role_new" TO "role";
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "role";
COMMIT;
