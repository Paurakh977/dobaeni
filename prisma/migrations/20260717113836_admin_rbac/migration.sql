-- AlterTable
ALTER TABLE "organization" ADD COLUMN     "analyticsLocked" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "banExpires" TIMESTAMP(3),
ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "banned" BOOLEAN DEFAULT false;
