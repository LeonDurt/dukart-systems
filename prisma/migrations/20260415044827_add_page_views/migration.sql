-- CreateTable
CREATE TABLE "public"."PageView" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "referer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);
