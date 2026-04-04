import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth/session"

export async function getDashboardStats() {
  const { tenantId } = await requireAuth()

  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59)

  const [
    openWorkOrders,
    readyForPickup,
    unpaidInvoices,
    todayPayments,
    monthPayments,
    lastMonthPayments,
    recentWorkOrders,
    recentInvoices,
    overdueInvoices,
  ] = await Promise.all([
    // Open work orders (not delivered or cancelled)
    prisma.workOrder.count({
      where: {
        tenantId,
        status: { notIn: ["DELIVERED", "CANCELLED"] },
      },
    }),

    // Ready for pickup
    prisma.workOrder.count({
      where: { tenantId, status: "READY_FOR_PICKUP" },
    }),

    // Unpaid invoices (sent or partially paid with balance > 0)
    prisma.invoice.count({
      where: {
        tenantId,
        status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] },
      },
    }),

    // Revenue today (sum of payments)
    prisma.payment.aggregate({
      where: {
        tenantId,
        createdAt: { gte: startOfToday },
      },
      _sum: { amount: true },
    }),

    // Revenue this month
    prisma.payment.aggregate({
      where: {
        tenantId,
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),

    // Revenue last month (for comparison)
    prisma.payment.aggregate({
      where: {
        tenantId,
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { amount: true },
    }),

    // Recent work orders (last 8)
    prisma.workOrder.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        customer: { select: { firstName: true, lastName: true } },
        vehicle: { select: { year: true, make: true, model: true } },
      },
    }),

    // Recent invoices (last 5)
    prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        customer: { select: { firstName: true, lastName: true } },
      },
    }),

    // Overdue invoices total
    prisma.invoice.aggregate({
      where: {
        tenantId,
        status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] },
      },
      _sum: { amountDue: true },
    }),
  ])

  const revenueToday = todayPayments._sum.amount?.toNumber() ?? 0
  const revenueMonth = monthPayments._sum.amount?.toNumber() ?? 0
  const revenueLastMonth = lastMonthPayments._sum.amount?.toNumber() ?? 0
  const overdueTotal = overdueInvoices._sum.amountDue?.toNumber() ?? 0

  const monthGrowth =
    revenueLastMonth > 0 ? ((revenueMonth - revenueLastMonth) / revenueLastMonth) * 100 : null

  return {
    openWorkOrders,
    readyForPickup,
    unpaidInvoices,
    overdueTotal,
    revenueToday,
    revenueMonth,
    revenueLastMonth,
    monthGrowth,
    recentWorkOrders,
    recentInvoices,
  }
}
