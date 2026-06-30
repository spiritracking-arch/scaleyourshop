/*
  Warnings:

  - You are about to drop the column `content` on the `BlogPost` table. All the data in the column will be lost.
  - You are about to drop the column `ctaPitch` on the `BlogPost` table. All the data in the column will be lost.
  - You are about to drop the column `eeatProof` on the `BlogPost` table. All the data in the column will be lost.
  - You are about to drop the column `geoQuestion` on the `BlogPost` table. All the data in the column will be lost.
  - You are about to drop the column `hasTableData` on the `BlogPost` table. All the data in the column will be lost.
  - You are about to drop the column `proofType` on the `BlogPost` table. All the data in the column will be lost.
  - You are about to drop the column `semanticHook` on the `BlogPost` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BlogPost" DROP COLUMN "content",
DROP COLUMN "ctaPitch",
DROP COLUMN "eeatProof",
DROP COLUMN "geoQuestion",
DROP COLUMN "hasTableData",
DROP COLUMN "proofType",
DROP COLUMN "semanticHook",
ADD COLUMN     "blocks" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "channelBlog" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "channelWebhookEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "distributionWebhookUrl" TEXT,
ADD COLUMN     "socialWebhookUrl" TEXT,
ADD COLUMN     "videos" JSONB NOT NULL DEFAULT '[]',
ALTER COLUMN "excerpt" SET DEFAULT '';
