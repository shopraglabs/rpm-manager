import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth/session"

export async function getVehicleServiceReminders(vehicleId: string) {
  const { tenantId } = await requireAuth()

  return prisma.serviceReminder.findMany({
    where: { vehicleId, tenantId },
    orderBy: [{ isCompleted: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  })
}

export async function getUpcomingServiceReminders(daysAhead = 30) {
  const { tenantId } = await requireAuth()

  const now = new Date()
  const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

  return prisma.serviceReminder.findMany({
    where: {
      tenantId,
      isCompleted: false,
      dueDate: { lte: cutoff },
    },
    orderBy: { dueDate: "asc" },
    take: 20,
    include: {
      vehicle: { select: { year: true, make: true, model: true, licensePlate: true } },
      customer: { select: { firstName: true, lastName: true } },
    },
  })
}
