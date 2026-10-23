-- CreateEnum
CREATE TYPE "public"."QuoteStatus" AS ENUM ('OPEN', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."Invoice" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "quoteStatus" "public"."QuoteStatus" DEFAULT 'OPEN';
