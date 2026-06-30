-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;
