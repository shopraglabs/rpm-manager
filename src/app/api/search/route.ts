import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

export type SearchResult = {
  id: string
  type: "customer" | "work-order" | "estimate" | "invoice" | "vehicle"
  title: string
  subtitle: string
  href: string
  meta?: string
}

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await requireAuth()
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? ""
    if (q.length < 2) return NextResponse.json({ results: [] })

    const limit = 5
    const contains = { contains: q, mode: "insensitive" as const }

    const [customers, workOrders, estimates, invoices, vehicles] = await Promise.all([
      // Customers
      prisma.customer.findMany({
        where: {
          tenantId,
          OR: [
            { firstName: contains },
            { lastName: contains },
            { phone: contains },
            { email: contains },
          ],
        },
        take: limit,
        select: { id: true, firstName: true, lastName: true, phone: true, email: true },
      }),

      // Work Orders
      prisma.workOrder.findMany({
        where: {
          tenantId,
          OR: [
            { orderNumber: contains },
            { notes: contains },
            { customer: { OR: [{ firstName: contains }, { lastName: contains }] } },
          ],
        },
        take: limit,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          customer: { select: { firstName: true, lastName: true } },
          vehicle: { select: { year: true, make: true, model: true } },
        },
      }),

      // Estimates
      prisma.estimate.findMany({
        where: {
          tenantId,
          OR: [
            { estimateNumber: contains },
            { customer: { OR: [{ firstName: contains }, { lastName: contains }] } },
          ],
        },
        take: limit,
        select: {
          id: true,
          estimateNumber: true,
          status: true,
          customer: { select: { firstName: true, lastName: true } },
        },
      }),

      // Invoices
      prisma.invoice.findMany({
        where: {
          tenantId,
          OR: [
            { invoiceNumber: contains },
            { customer: { OR: [{ firstName: contains }, { lastName: contains }] } },
          ],
        },
        take: limit,
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          customer: { select: { firstName: true, lastName: true } },
        },
      }),

      // Vehicles
      prisma.vehicle.findMany({
        where: {
          tenantId,
          OR: [
            { make: contains },
            { model: contains },
            { vin: contains },
            { licensePlate: contains },
          ],
        },
        take: limit,
        select: {
          id: true,
          year: true,
          make: true,
          model: true,
          licensePlate: true,
          vin: true,
          customer: { select: { firstName: true, lastName: true } },
        },
      }),
    ])

    const results: SearchResult[] = [
      ...customers.map((c) => ({
        id: c.id,
        type: "customer" as const,
        title: `${c.firstName} ${c.lastName}`,
        subtitle: [c.phone, c.email].filter(Boolean).join(" · ") || "No contact info",
        href: `/customers/${c.id}`,
      })),
      ...workOrders.map((wo) => ({
        id: wo.id,
        type: "work-order" as const,
        title: wo.orderNumber,
        subtitle: `${wo.customer.firstName} ${wo.customer.lastName}`,
        href: `/work-orders/${wo.id}`,
        meta: `${wo.vehicle.year ?? ""} ${wo.vehicle.make} ${wo.vehicle.model}`.trim(),
      })),
      ...estimates.map((e) => ({
        id: e.id,
        type: "estimate" as const,
        title: e.estimateNumber,
        subtitle: `${e.customer.firstName} ${e.customer.lastName}`,
        href: `/estimates/${e.id}`,
        meta: e.status.toLowerCase(),
      })),
      ...invoices.map((inv) => ({
        id: inv.id,
        type: "invoice" as const,
        title: inv.invoiceNumber,
        subtitle: `${inv.customer.firstName} ${inv.customer.lastName}`,
        href: `/invoices/${inv.id}`,
        meta: inv.status.toLowerCase().replace("_", " "),
      })),
      ...vehicles.map((v) => ({
        id: v.id,
        type: "vehicle" as const,
        title: [v.year, v.make, v.model].filter(Boolean).join(" "),
        subtitle: `${v.customer.firstName} ${v.customer.lastName}`,
        href: `/vehicles/${v.id}`,
        meta: v.licensePlate ?? v.vin ?? undefined,
      })),
    ]

    return NextResponse.json({ results })
  } catch (err) {
    console.error("[search]", err)
    return NextResponse.json({ results: [] })
  }
}
