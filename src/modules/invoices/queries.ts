import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth/session"
import { PAGINATION_PAGE_SIZE } from "@/lib/utils/constants"

export async function getInvoices(params: {
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
        { invoiceNumber: { contains: search, mode: "insensitive" as const } },
        { customer: { firstName: { contains: search, mode: "insensitive" as const } } },
        { customer: { lastName: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
  }

  const [items, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        customer: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.invoice.count({ where }),
  ])

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function getInvoice(id: string) {
  const { tenantId } = await requireAuth()

  return prisma.invoice.findFirst({
    where: { id, tenantId },
    include: {
      customer: true,
      workOrder: {
        select: {
          id: true,
          orderNumber: true,
          vehicle: { select: { year: true, make: true, model: true } },
        },
      },
      lineItems: { orderBy: { sortOrder: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  })
}

export async function getInvoiceByToken(token: string) {
  return prisma.invoice.findUnique({
    where: { shareToken: token },
    include: {
      customer: { select: { firstName: true, lastName: true, email: true } },
      lineItems: { orderBy: { sortOrder: "asc" } },
      payments: { select: { amount: true, method: true, createdAt: true, stripePaymentId: true } },
    },
  })
}
