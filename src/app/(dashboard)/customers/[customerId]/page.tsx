import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Plus, Pencil, Car, FileText, Wrench, Receipt, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SendSmsDialog } from "@/components/customers/send-sms-dialog"
import { getCustomer } from "@/modules/customers/queries"
import { formatPhone, formatDate, formatCurrency } from "@/lib/utils/format"

export const metadata: Metadata = { title: "Customer" }

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>
}) {
  const { customerId } = await params
  const customer = await getCustomer(customerId)
  if (!customer) notFound()

  const fullName = `${customer.firstName} ${customer.lastName}`

  // Compute stats
  const lifetimeRevenue = customer.invoices
    .filter((inv) => inv.status !== "VOID")
    .reduce((sum, inv) => sum + inv.total.toNumber(), 0)
  const outstandingBalance = customer.invoices.reduce(
    (sum, inv) => sum + inv.amountDue.toNumber(),
    0
  )
  const totalVisits = customer.workOrders.length
  const lastVisit =
    customer.workOrders.length > 0
      ? new Date(Math.max(...customer.workOrders.map((wo) => new Date(wo.createdAt).getTime())))
      : null

  // Build unified activity timeline
  type ActivityItem = {
    id: string
    type: "estimate" | "work-order" | "invoice"
    date: Date
    number: string
    status: string
    amount: number
    href: string
    vehicle?: string
  }
  const activities: ActivityItem[] = [
    ...customer.estimates.map((e) => ({
      id: e.id,
      type: "estimate" as const,
      date: new Date(e.createdAt),
      number: e.estimateNumber,
      status: e.status,
      amount: e.total.toNumber(),
      href: `/estimates/${e.id}`,
      vehicle: [e.vehicle.year, e.vehicle.make, e.vehicle.model].filter(Boolean).join(" "),
    })),
    ...customer.workOrders.map((wo) => ({
      id: wo.id,
      type: "work-order" as const,
      date: new Date(wo.createdAt),
      number: wo.orderNumber,
      status: wo.status,
      amount: wo.total.toNumber(),
      href: `/work-orders/${wo.id}`,
      vehicle: [wo.vehicle.year, wo.vehicle.make, wo.vehicle.model].filter(Boolean).join(" "),
    })),
    ...customer.invoices.map((inv) => ({
      id: inv.id,
      type: "invoice" as const,
      date: new Date(inv.createdAt),
      number: inv.invoiceNumber,
      status: inv.status,
      amount: inv.total.toNumber(),
      href: `/invoices/${inv.id}`,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" render={<Link href="/customers" />}>
          <ChevronLeft className="h-4 w-4" />
          Customers
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{fullName}</h1>
          <div className="flex items-center gap-2 mt-1">
            {customer.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {customer.phone && (
            <SendSmsDialog customerId={customer.id} customerName={customer.firstName} />
          )}
          <Button variant="outline" render={<Link href={`/customers/${customer.id}/edit`} />}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            render={<Link href={`/work-orders/new?customerId=${customer.id}`} />}
          >
            <Wrench className="h-4 w-4 mr-2" />
            New Work Order
          </Button>
          <Button render={<Link href={`/estimates/new?customerId=${customer.id}`} />}>
            <Plus className="h-4 w-4 mr-2" />
            New Estimate
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Lifetime Revenue</p>
          <p className="text-lg font-semibold tabular-nums mt-0.5">
            {formatCurrency(lifetimeRevenue)}
          </p>
        </div>
        <div className="rounded-xl border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Total Visits</p>
          <p className="text-lg font-semibold mt-0.5">{totalVisits}</p>
        </div>
        <div className="rounded-xl border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p
            className={`text-lg font-semibold tabular-nums mt-0.5 ${outstandingBalance > 0 ? "text-destructive" : "text-muted-foreground"}`}
          >
            {outstandingBalance > 0 ? formatCurrency(outstandingBalance) : "—"}
          </p>
        </div>
        <div className="rounded-xl border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Last Visit</p>
          <p className="text-lg font-semibold mt-0.5">{lastVisit ? formatDate(lastVisit) : "—"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Contact Info */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border bg-card p-5">
            <h2 className="font-medium mb-4">Contact Information</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="font-medium mt-0.5">
                  {customer.phone ? (
                    <a href={`tel:${customer.phone}`} className="hover:underline">
                      {formatPhone(customer.phone)}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium mt-0.5">
                  {customer.email ? (
                    <a href={`mailto:${customer.email}`} className="hover:underline">
                      {customer.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Address</dt>
                <dd className="font-medium mt-0.5">
                  {customer.address ? (
                    <span>
                      {customer.address}
                      <br />
                      {[customer.city, customer.state, customer.zip].filter(Boolean).join(", ")}
                    </span>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Customer since</dt>
                <dd className="font-medium mt-0.5">{formatDate(customer.createdAt)}</dd>
              </div>
            </dl>

            {customer.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Vehicles */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium">Vehicles</h2>
              <Button
                variant="outline"
                size="sm"
                render={<Link href={`/customers/${customer.id}/vehicles/new`} />}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Vehicle
              </Button>
            </div>

            {customer.vehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Car className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground text-sm">No vehicles on file.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  render={<Link href={`/customers/${customer.id}/vehicles/new`} />}
                >
                  Add first vehicle
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {customer.vehicles.map((v) => (
                  <Link
                    key={v.id}
                    href={`/vehicles/${v.id}`}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">
                        {v.year} {v.make} {v.model}
                        {v.trim ? ` ${v.trim}` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {[v.color, v.licensePlate, v.vin ? `VIN: ${v.vin}` : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-muted-foreground rotate-180" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      {activities.length > 0 && (
        <div className="mt-6 rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-medium">Activity Timeline</h2>
          </div>
          <div className="divide-y">
            {activities.map((item) => {
              const Icon =
                item.type === "estimate" ? FileText : item.type === "work-order" ? Wrench : Receipt
              const typeLabel =
                item.type === "estimate"
                  ? "Estimate"
                  : item.type === "work-order"
                    ? "Work Order"
                    : "Invoice"
              const statusFormatted = item.status
                .toLowerCase()
                .replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase())
              const statusColor =
                item.status === "PAID" || item.status === "APPROVED" || item.status === "DELIVERED"
                  ? "text-green-600"
                  : item.status === "VOID" || item.status === "CANCELLED"
                    ? "text-muted-foreground"
                    : item.status === "OVERDUE"
                      ? "text-destructive"
                      : "text-foreground"

              return (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.href}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{typeLabel}</span>
                      <span className="font-mono text-xs font-medium">{item.number}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.vehicle && <span>{item.vehicle} · </span>}
                      {formatDate(item.date)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium tabular-nums">
                      {formatCurrency(item.amount)}
                    </p>
                    <p className={`text-xs ${statusColor}`}>{statusFormatted}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
