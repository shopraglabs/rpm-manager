import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth/session"
import { PAGINATION_PAGE_SIZE } from "@/lib/utils/constants"

export async function getWorkOrders(params: {
  page?: number
  pageSize?: number
  search?: string
  status?: string
}) {
  const { tenantId } = await requireAuth()
  const { page = 1, pageSize = PAGINATION_PAGE_SIZE, search, status } = params

  const where = {
    tenantId,
    ...(status && { status: status as never }),
    ...(search && {
      OR: [
        { orderNumber: { contains: search, mode: "insensitive" as const } },
        { vehicle: { make: { contains: search, mode: "insensitive" as const } } },
        { vehicle: { model: { contains: search, mode: "insensitive" as const } } },
        { vehicle: { licensePlate: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
  }

  const [items, total] = await Promise.all([
    prisma.workOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        vehicle: {
          select: {
            id: true,
            year: true,
            make: true,
            model: true,
            licensePlate: true,
          },
        },
        customer: {
          select: { id: true, firstName: true, lastName: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    }),
    prisma.workOrder.count({ where }),
  ])

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getWorkOrder(id: string) {
  const { tenantId } = await requireAuth()

  return prisma.workOrder.findFirst({
    where: { id, tenantId },
    include: {
      vehicle: true,
      customer: { select: { id: true, firstName: true, lastName: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
      lineItems: { orderBy: { sortOrder: "asc" } },
      invoice: { select: { id: true } },
      statusHistory: {
        orderBy: { createdAt: "desc" },
        include: {
          changedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      estimate: { select: { id: true, estimateNumber: true } },
    },
  })
}

export async function getTechnicians(tenantId: string) {
  return prisma.user.findMany({
    where: {
      tenantId,
      isActive: true,
      role: { in: ["TECHNICIAN", "MANAGER", "OWNER"] },
    },
    select: { id: true, firstName: true, lastName: true, role: true },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  })
}
