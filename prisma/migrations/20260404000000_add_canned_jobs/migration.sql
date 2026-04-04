-- CreateTable
CREATE TABLE "canned_jobs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "LineItemType" NOT NULL DEFAULT 'LABOR',
    "unitPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "taxable" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canned_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "canned_jobs_tenantId_isActive_idx" ON "canned_jobs"("tenantId", "isActive");

-- AddForeignKey
ALTER TABLE "canned_jobs" ADD CONSTRAINT "canned_jobs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
