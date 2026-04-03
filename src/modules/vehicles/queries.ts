import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth/session"

export async function getVehicle(id: string) {
  const { tenantId } = await requireAuth()

  return prisma.vehicle.findFirst({
    where: { id, tenantId },
    include: {
      customer: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  })
}
