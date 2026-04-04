import type { Metadata } from "next"
import Link from "next/link"
import { Car } from "lucide-react"
import { SearchBar } from "@/components/ui/search-bar"
import { PaginationNav } from "@/components/ui/pagination-nav"
import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { PAGINATION_PAGE_SIZE } from "@/lib/utils/constants"

export const metadata: Metadata = { title: "Vehicles" }

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const { page, search } = await searchParams
  const { tenantId } = await requireAuth()
  const currentPage = page ? parseInt(page) : 1

  const where = {
    tenantId,
    ...(search
      ? {
          OR: [
            { make: { contains: search, mode: "insensitive" as const } },
            { model: { contains: search, mode: "insensitive" as const } },
            { licensePlate: { contains: search, mode: "insensitive" as const } },
            { vin: { contains: search, mode: "insensitive" as const } },
            { customer: { firstName: { contains: search, mode: "insensitive" as const } } },
            { customer: { lastName: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  }

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy: [{ customer: { lastName: "asc" } }, { make: "asc" }],
      skip: (currentPage - 1) * PAGINATION_PAGE_SIZE,
      take: PAGINATION_PAGE_SIZE,
      select: {
        id: true,
        year: true,
        make: true,
        model: true,
        trim: true,
        color: true,
        licensePlate: true,
        vin: true,
        mileage: true,
        customer: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { workOrders: true } },
      },
    }),
    prisma.vehicle.count({ where }),
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vehicles</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {total} vehicle{total !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <SearchBar
          placeholder="Search by make, model, plate, VIN, or customer name…"
          initialValue={search ?? ""}
        />
      </div>

      {vehicles.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <Car className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {search ? `No vehicles matching "${search}".` : "No vehicles yet."}
          </p>
          {search && (
            <Link
              href="/vehicles"
              className="text-xs text-muted-foreground hover:text-foreground underline mt-2 inline-block"
            >
              Clear search
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vehicle</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  Plate / VIN
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                  Mileage
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                  Work Orders
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {vehicles.map((v) => {
                const vehicleLabel = [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ")
                return (
                  <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/vehicles/${v.id}`} className="block">
                        <p className="font-medium hover:underline">{vehicleLabel}</p>
                        {v.color && (
                          <p className="text-xs text-muted-foreground mt-0.5">{v.color}</p>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {v.licensePlate ? (
                        <p className="font-mono text-sm">{v.licensePlate}</p>
                      ) : null}
                      {v.vin ? (
                        <p className="font-mono text-xs text-muted-foreground truncate max-w-[160px]">
                          {v.vin}
                        </p>
                      ) : !v.licensePlate ? (
                        <span className="text-muted-foreground">—</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/customers/${v.customer.id}`}
                        className="text-sm hover:underline"
                      >
                        {v.customer.firstName} {v.customer.lastName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums hidden lg:table-cell">
                      {v.mileage != null ? v.mileage.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums hidden lg:table-cell">
                      {v._count.workOrders > 0 ? (
                        <span className="font-medium">{v._count.workOrders}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <PaginationNav
        page={currentPage}
        totalPages={Math.ceil(total / PAGINATION_PAGE_SIZE)}
        total={total}
        pageSize={PAGINATION_PAGE_SIZE}
        buildHref={(p) => {
          const sp = new URLSearchParams()
          sp.set("page", String(p))
          if (search) sp.set("search", search)
          return `/vehicles?${sp.toString()}`
        }}
      />
    </div>
  )
}
