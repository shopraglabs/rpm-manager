import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth/session"

export async function getInspection(inspectionId: string) {
  const { tenantId } = await requireAuth()

  return prisma.inspection.findFirst({
    where: { id: inspectionId, tenantId },
    include: {
      workOrder: {
        select: {
          id: true,
          orderNumber: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          year: true,
          make: true,
          model: true,
          licensePlate: true,
          vin: true,
        },
      },
      technician: {
        select: { firstName: true, lastName: true },
      },
      items: {
        orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
        include: {
          photos: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  })
}

export async function getWorkOrderInspection(workOrderId: string) {
  const { tenantId } = await requireAuth()

  return prisma.inspection.findFirst({
    where: { workOrderId, tenantId },
    select: {
      id: true,
      status: true,
      completedAt: true,
      sentToCustomer: true,
      shareToken: true,
      _count: { select: { items: true } },
    },
  })
}

export async function getInspectionByToken(token: string) {
  return prisma.inspection.findUnique({
    where: { shareToken: token },
    include: {
      vehicle: {
        select: {
          year: true,
          make: true,
          model: true,
          licensePlate: true,
        },
      },
      technician: {
        select: { firstName: true, lastName: true },
      },
      items: {
        orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
      },
    },
  })
}
