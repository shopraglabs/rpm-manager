import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Pencil, Plus, FileText, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getVehicle } from "@/modules/vehicles/queries"
import { formatDate, formatCurrency } from "@/lib/utils/format"

export const metadata: Metadata = { title: "Vehicle" }

const TRANSMISSION_LABELS: Record<string, string> = {
  AUTOMATIC: "Automatic",
  MANUAL: "Manual",
  CVT: "CVT",
  OTHER: "Other",
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>
}) {
  const { vehicleId } = await params
  const vehicle = await getVehicle(vehicleId)
  if (!vehicle) notFound()

  const title = `${vehicle.year ? `${vehicle.year} ` : ""}${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ""}`

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" render={<Link href={`/customers/${vehicle.customer.id}`} />}>
          <ChevronLeft className="h-4 w-4" />
          {vehicle.customer.firstName} {vehicle.customer.lastName}
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {vehicle.licensePlate && (
            <p className="text-muted-foreground text-sm mt-0.5">{vehicle.licensePlate}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href={`/vehicles/${vehicle.id}/edit`} />}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button render={<Link href={`/estimates/new?vehicleId=${vehicle.id}&customerId=${vehicle.customer.id}`} />}>
            <Plus className="h-4 w-4 mr-2" />
            New Estimate
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-medium mb-4">Vehicle Details</h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Year</dt>
            <dd className="font-medium mt-0.5">{vehicle.year ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Make</dt>
            <dd className="font-medium mt-0.5">{vehicle.make}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Model</dt>
            <dd className="font-medium mt-0.5">{vehicle.model}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Trim</dt>
            <dd className="font-medium mt-0.5">{vehicle.trim ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Color</dt>
            <dd className="font-medium mt-0.5">{vehicle.color ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Mileage</dt>
            <dd className="font-medium mt-0.5">
              {vehicle.mileage != null ? vehicle.mileage.toLocaleString() : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Engine</dt>
            <dd className="font-medium mt-0.5">{vehicle.engineSize ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Transmission</dt>
            <dd className="font-medium mt-0.5">
              {vehicle.transmission ? TRANSMISSION_LABELS[vehicle.transmission] ?? vehicle.transmission : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">License plate</dt>
            <dd className="font-medium mt-0.5">{vehicle.licensePlate ?? "—"}</dd>
          </div>
          <div className="col-span-2 sm:col-span-3">
            <dt className="text-muted-foreground">VIN</dt>
            <dd className="font-medium mt-0.5 font-mono">{vehicle.vin ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Added</dt>
            <dd className="font-medium mt-0.5">{formatDate(vehicle.createdAt)}</dd>
          </div>
        </dl>

        {vehicle.notes && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm whitespace-pre-wrap">{vehicle.notes}</p>
          </div>
        )}
      </div>

      {/* Service history */}
      {(vehicle.workOrders.length > 0 || vehicle.estimates.length > 0) && (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {vehicle.workOrders.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-medium">Work Orders</h2>
              </div>
              <div className="space-y-2 text-sm">
                {vehicle.workOrders.map((wo) => (
                  <Link
                    key={wo.id}
                    href={`/work-orders/${wo.id}`}
                    className="flex items-center justify-between py-1.5 hover:text-primary"
                  >
                    <div>
                      <span className="font-mono text-xs">{wo.orderNumber}</span>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(wo.createdAt)}
                        {wo.mileageIn != null && ` · ${wo.mileageIn.toLocaleString()} mi`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium tabular-nums">{formatCurrency(wo.total.toNumber())}</p>
                      <p className="text-xs text-muted-foreground capitalize">{wo.status.toLowerCase().replace(/_/g, " ")}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {vehicle.estimates.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-medium">Estimates</h2>
              </div>
              <div className="space-y-2 text-sm">
                {vehicle.estimates.map((est) => (
                  <Link
                    key={est.id}
                    href={`/estimates/${est.id}`}
                    className="flex items-center justify-between py-1.5 hover:text-primary"
                  >
                    <div>
                      <span className="font-mono text-xs">{est.estimateNumber}</span>
                      <p className="text-xs text-muted-foreground">{formatDate(est.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium tabular-nums">{formatCurrency(est.total.toNumber())}</p>
                      <p className="text-xs text-muted-foreground capitalize">{est.status.toLowerCase()}</p>
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
