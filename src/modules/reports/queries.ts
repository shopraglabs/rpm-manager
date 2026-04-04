import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth/session"

export interface MonthlyRevenue {
  month: string // "Jan 2025"
  revenue: number
  payments: number
}

export interface WorkOrderVolume {
  month: string
  count: number
  completed: number
}

export interface TopService {
  description: string
  count: number
  revenue: number
}

export interface TechnicianStat {
  name: string
  workOrders: number
  completed: number
}

export async function getReportData(months = 12) {
  const { tenantId } = await requireAuth()

  const now = new Date()
  // Start of `months` months ago
  const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)

  const [payments, workOrders, lineItems, technicians] = await Promise.all([
    // All payments in range
    prisma.payment.findMany({
      where: { tenantId, createdAt: { gte: startDate } },
      select: { amount: true, createdAt: true },
    }),

    // All work orders in range
    prisma.workOrder.findMany({
      where: { tenantId, createdAt: { gte: startDate } },
      select: {
        status: true,
        createdAt: true,
        total: true,
        assignedTo: { select: { firstName: true, lastName: true } },
      },
    }),

    // Line items from invoices in range (for top services)
    prisma.invoiceLineItem.findMany({
      where: {
        invoice: {
          tenantId,
          createdAt: { gte: startDate },
          status: { notIn: ["VOID", "DRAFT"] },
        },
        type: { in: ["LABOR", "PART", "SUBLET"] },
      },
      select: {
        description: true,
        quantity: true,
        unitPrice: true,
        type: true,
      },
      take: 500,
    }),

    // Technicians for stats
    prisma.user.findMany({
      where: { tenantId, isActive: true, role: { in: ["TECHNICIAN", "MANAGER", "OWNER"] } },
      select: { id: true, firstName: true, lastName: true },
    }),
  ])

  // ── Monthly revenue buckets ───────────────────────────────────────────────
  const revByMonth = new Map<string, { revenue: number; payments: number }>()
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1)
    const key = d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    revByMonth.set(key, { revenue: 0, payments: 0 })
  }
  for (const p of payments) {
    const key = new Date(p.createdAt).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    })
    const bucket = revByMonth.get(key)
    if (bucket) {
      bucket.revenue += p.amount.toNumber()
      bucket.payments += 1
    }
  }
  const monthlyRevenue: MonthlyRevenue[] = Array.from(revByMonth.entries()).map(([month, v]) => ({
    month,
    ...v,
  }))

  // ── Monthly work order volume ─────────────────────────────────────────────
  const woByMonth = new Map<string, { count: number; completed: number }>()
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1)
    const key = d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    woByMonth.set(key, { count: 0, completed: 0 })
  }
  for (const wo of workOrders) {
    const key = new Date(wo.createdAt).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    })
    const bucket = woByMonth.get(key)
    if (bucket) {
      bucket.count += 1
      if (["COMPLETED", "READY_FOR_PICKUP", "DELIVERED"].includes(wo.status)) {
        bucket.completed += 1
      }
    }
  }
  const workOrderVolume: WorkOrderVolume[] = Array.from(woByMonth.entries()).map(([month, v]) => ({
    month,
    ...v,
  }))

  // ── Top services (by revenue from labor line items) ───────────────────────
  const serviceMap = new Map<string, { count: number; revenue: number }>()
  for (const item of lineItems) {
    if (item.type !== "LABOR") continue
    // Normalize description (lowercase, trim, truncate)
    const key = item.description.trim().toLowerCase().slice(0, 60)
    const display = item.description.trim().slice(0, 60)
    const existing = serviceMap.get(key)
    const lineRevenue = item.quantity.toNumber() * item.unitPrice.toNumber()
    if (existing) {
      existing.count += 1
      existing.revenue += lineRevenue
    } else {
      serviceMap.set(key, { count: 1, revenue: lineRevenue })
    }
    // Store display version (first occurrence)
    if (!serviceMap.has(display.toLowerCase())) {
      serviceMap.set(display.toLowerCase(), serviceMap.get(key)!)
    }
  }
  const topServices: TopService[] = Array.from(serviceMap.entries())
    .map(([desc, v]) => ({
      description: desc.charAt(0).toUpperCase() + desc.slice(1),
      ...v,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)

  // ── Technician stats ──────────────────────────────────────────────────────
  const techStats: TechnicianStat[] = technicians
    .map((tech) => {
      const assigned = workOrders.filter(
        (wo) =>
          wo.assignedTo?.firstName === tech.firstName && wo.assignedTo?.lastName === tech.lastName
      )
      return {
        name: `${tech.firstName} ${tech.lastName}`,
        workOrders: assigned.length,
        completed: assigned.filter((wo) =>
          ["COMPLETED", "READY_FOR_PICKUP", "DELIVERED"].includes(wo.status)
        ).length,
      }
    })
    .filter((t) => t.workOrders > 0)
    .sort((a, b) => b.completed - a.completed)

  // ── Summary KPIs ──────────────────────────────────────────────────────────
  const totalRevenue = payments.reduce((s, p) => s + p.amount.toNumber(), 0)
  const totalWOs = workOrders.length
  const completedWOs = workOrders.filter((wo) =>
    ["COMPLETED", "READY_FOR_PICKUP", "DELIVERED"].includes(wo.status)
  ).length
  const avgRepairOrder =
    totalWOs > 0 ? workOrders.reduce((s, wo) => s + wo.total.toNumber(), 0) / totalWOs : 0

  return {
    monthlyRevenue,
    workOrderVolume,
    topServices,
    techStats,
    summary: {
      totalRevenue,
      totalWOs,
      completedWOs,
      avgRepairOrder: Math.round(avgRepairOrder * 100) / 100,
      completionRate: totalWOs > 0 ? Math.round((completedWOs / totalWOs) * 100) : 0,
    },
  }
}
