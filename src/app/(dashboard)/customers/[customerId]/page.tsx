import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Plus, Pencil, Car, FileText, Wrench, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
          <Button variant="outline" render={<Link href={`/customers/${customer.id}/edit`} />}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button render={<Link href={`/estimates/new?customerId=${customer.id}`} />}>
            <Plus className="h-4 w-4 mr-2" />
            New Estimate
          </Button>
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
                  ) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium mt-0.5">
                  {customer.email ? (
                    <a href={`mailto:${customer.email}`} className="hover:underline">
                      {customer.email}
                    </a>
                  ) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Address</dt>
                <dd className="font-medium mt-0.5">
                  {customer.address ? (
                    <span>
                      {customer.address}<br />
                      {[customer.city, customer.state, customer.zip]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  ) : "—"}
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
              <Button variant="outline" size="sm" render={<Link href={`/customers/${customer.id}/vehicles/new`} />}>
                <Plus className="h-4 w-4 mr-1.5" />
                Add Vehicle
              </Button>
            </div>

            {customer.vehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Car className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground text-sm">No vehicles on file.</p>
                <Button variant="outline" size="sm" className="mt-3" render={<Link href={`/customers/${customer.id}/vehicles/new`} />}>
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

      {/* Service History */}
      {(customer.estimates.length > 0 || customer.workOrders.length > 0 || customer.invoices.length > 0) && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Estimates */}
          {customer.estimates.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-medium">Estimates</h2>
              </div>
              <div className="space-y-2">
                {customer.estimates.map((est) => (
                  <Link
                    key={est.id}
                    href={`/estimates/${est.id}`}
                    className="flex items-center justify-between py-1.5 hover:text-primary transition-colors"
                  >
                    <div>
                      <span className="text-xs font-mono">{est.estimateNumber}</span>
                      <p className="text-xs text-muted-foreground">
                        {est.vehicle.year} {est.vehicle.make} {est.vehicle.model} · {formatDate(est.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium tabular-nums">{formatCurrency(est.total.toNumber())}</p>
                      <p className="text-xs text-muted-foreground capitalize">{est.status.toLowerCase()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Work Orders */}
          {customer.workOrders.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-medium">Work Orders</h2>
              </div>
              <div className="space-y-2">
                {customer.workOrders.map((wo) => (
                  <Link
                    key={wo.id}
                    href={`/work-orders/${wo.id}`}
                    className="flex items-center justify-between py-1.5 hover:text-primary transition-colors"
                  >
                    <div>
                      <span className="text-xs font-mono">{wo.orderNumber}</span>
                      <p className="text-xs text-muted-foreground">
                        {wo.vehicle.year} {wo.vehicle.make} {wo.vehicle.model} · {formatDate(wo.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium tabular-nums">{formatCurrency(wo.total.toNumber())}</p>
                      <p className="text-xs text-muted-foreground capitalize">{wo.status.toLowerCase().replace("_", " ")}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Invoices */}
          {customer.invoices.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-medium">Invoices</h2>
              </div>
              <div className="space-y-2">
                {customer.invoices.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="flex items-center justify-between py-1.5 hover:text-primary transition-colors"
                  >
                    <div>
                      <span className="text-xs font-mono">{inv.invoiceNumber}</span>
                      <p className="text-xs text-muted-foreground">{formatDate(inv.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium tabular-nums">{formatCurrency(inv.total.toNumber())}</p>
                      {inv.amountDue.toNumber() > 0 && inv.status !== "PAID" && (
                        <p className="text-xs text-orange-600">Due: {formatCurrency(inv.amountDue.toNumber())}</p>
                      )}
                      {inv.status === "PAID" && (
                        <p className="text-xs text-green-600">Paid</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
