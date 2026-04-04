import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth/session"

export async function getCannedJobs({ activeOnly = false }: { activeOnly?: boolean } = {}) {
  const { tenantId } = await requireAuth()
  return prisma.cannedJob.findMany({
    where: { tenantId, ...(activeOnly ? { isActive: true } : {}) },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  })
}

export async function getCannedJob(id: string) {
  const { tenantId } = await requireAuth()
  return prisma.cannedJob.findFirst({ where: { id, tenantId } })
}
