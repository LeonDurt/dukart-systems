-- CreateTable
CREATE TABLE "public"."MaintenanceContract" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "intervalMonths" INTEGER NOT NULL DEFAULT 12,
    "lastServiceDate" TIMESTAMP(3),
    "nextServiceDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceContract_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."MaintenanceContract" ADD CONSTRAINT "MaintenanceContract_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
