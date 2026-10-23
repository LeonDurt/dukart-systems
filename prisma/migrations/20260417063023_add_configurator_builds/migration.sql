-- CreateTable
CREATE TABLE "public"."ConfiguratorBuild" (
    "id" TEXT NOT NULL,
    "useCase" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "cpu" TEXT NOT NULL,
    "gpu" TEXT NOT NULL,
    "ram" TEXT NOT NULL,
    "storage" TEXT NOT NULL,
    "cooling" TEXT NOT NULL,
    "pcCase" TEXT NOT NULL,
    "psu" TEXT NOT NULL,
    "priceRange" TEXT NOT NULL,
    "servicePrice" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguratorBuild_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguratorBuild_useCase_budget_key" ON "public"."ConfiguratorBuild"("useCase", "budget");
