-- CreateTable
CREATE TABLE "service_reminders" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "dueMileage" INTEGER,
    "notes" TEXT,
    "reminderSentAt" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_reminders_tenantId_idx" ON "service_reminders"("tenantId");
CREATE INDEX "service_reminders_vehicleId_idx" ON "service_reminders"("vehicleId");
CREATE INDEX "service_reminders_customerId_idx" ON "service_reminders"("customerId");
CREATE INDEX "service_reminders_tenantId_dueDate_idx" ON "service_reminders"("tenantId", "dueDate");
CREATE INDEX "service_reminders_tenantId_isCompleted_idx" ON "service_reminders"("tenantId", "isCompleted");

-- AddForeignKey
ALTER TABLE "service_reminders" ADD CONSTRAINT "service_reminders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_reminders" ADD CONSTRAINT "service_reminders_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_reminders" ADD CONSTRAINT "service_reminders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
