import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth/session"
import { PAGINATION_PAGE_SIZE } from "@/lib/utils/constants"

export async function getEstimates(params: {
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
        { estimateNumber: { contains: search, mode: "insensitive" as const } },
        { customer: { firstName: { contains: search, mode: "insensitive" as const } } },
        { customer: { lastName: { contains: search, mode: "insensitive" as const } } },
        { vehicle: { make: { contains: search, mode: "insensitive" as const } } },
        { vehicle: { model: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
  }

  const [items, total] = await Promise.all([
    prisma.estimate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        customer: { select: { id: true, firstName: true, lastName: true } },
        vehicle: { select: { id: true, year: true, make: true, model: true } },
      },
    }),
    prisma.estimate.count({ where }),
  ])

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getEstimate(id: string) {
  const { tenantId } = await requireAuth()

  return prisma.estimate.findFirst({
    where: { id, tenantId },
    include: {
      customer: true,
      vehicle: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
      workOrder: { select: { id: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      versions: {
        orderBy: { version: "desc" },
        select: { id: true, version: true, createdAt: true, snapshot: true },
      },
    },
  })
}

export async function getEstimateByToken(token: string) {
  return prisma.estimate.findUnique({
    where: { shareToken: token },
    include: {
      customer: { select: { firstName: true, lastName: true } },
      vehicle: { select: { year: true, make: true, model: true, trim: true } },
      lineItems: { orderBy: { sortOrder: "asc" } },
    },
  })
}
