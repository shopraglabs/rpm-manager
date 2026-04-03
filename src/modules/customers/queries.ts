import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth/session"
import { PAGINATION_PAGE_SIZE } from "@/lib/utils/constants"

export async function getCustomers(params: {
  page?: number
  pageSize?: number
  search?: string
}) {
  const { tenantId } = await requireAuth()
  const { page = 1, pageSize = PAGINATION_PAGE_SIZE, search } = params

  const where = {
    tenantId,
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { phone: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  }

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { vehicles: true } },
      },
    }),
    prisma.customer.count({ where }),
  ])

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getCustomer(id: string) {
  const { tenantId } = await requireAuth()

  return prisma.customer.findFirst({
    where: { id, tenantId },
    include: {
      vehicles: {
        orderBy: { createdAt: "desc" },
      },
      estimates: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          estimateNumber: true,
          status: true,
          total: true,
          createdAt: true,
          vehicle: { select: { year: true, make: true, model: true } },
        },
      },
      workOrders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
          vehicle: { select: { year: true, make: true, model: true } },
        },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          total: true,
          amountDue: true,
          createdAt: true,
        },
      },
    },
  })
}

export async function searchCustomers(query: string, limit = 10) {
  const { tenantId } = await requireAuth()

  return prisma.customer.findMany({
    where: {
      tenantId,
      OR: [
        { firstName: { contains: query, mode: "insensitive" as const } },
        { lastName: { contains: query, mode: "insensitive" as const } },
        { phone: { contains: query, mode: "insensitive" as const } },
        { email: { contains: query, mode: "insensitive" as const } },
      ],
    },
    take: limit,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  })
}
