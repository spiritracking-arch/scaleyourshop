-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "passwordHash" TEXT;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "passwordHash" TEXT;
