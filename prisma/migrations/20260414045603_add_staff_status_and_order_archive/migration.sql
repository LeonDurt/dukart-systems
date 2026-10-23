-- CreateEnum
CREATE TYPE "public"."StaffStatus" AS ENUM ('AVAILABLE', 'BUSY', 'BREAK', 'OFFLINE');

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."StaffProfile" ADD COLUMN     "status" "public"."StaffStatus" NOT NULL DEFAULT 'OFFLINE';
