import type { Metadata } from "next"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getEstimates } from "@/modules/estimates/queries"
import { formatCurrency, formatDate } from "@/lib/utils/format"

export const metadata: Metadata = { title: "Estimates" }

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SENT: "bg-blue-50 text-blue-700 border-blue-200",
  VIEWED: "bg-blue-50 text-blue-600 border-blue-200",
  APPROVED: "bg-green-50 text-green-700 border-green-200",
  DECLINED: "bg-red-50 text-red-700 border-red-200",
  EXPIRED: "bg-orange-50 text-orange-700 border-orange-200",
  CONVERTED: "bg-purple-50 text-purple-700 border-purple-200",
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  VIEWED: "Viewed",
  APPROVED: "Approved",
  DECLINED: "Declined",
  EXPIRED: "Expired",
  CONVERTED: "Converted",
}

export default async function EstimatesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>
}) {
  const { page, search, status } = await searchParams
  const result = await getEstimates({
    page: page ? parseInt(page) : 1,
    search: search ?? undefined,
    status: status ?? undefined,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Estimates</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {result.total} estimate{result.total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button render={<Link href="/estimates/new" />}>
          <Plus className="h-4 w-4 mr-2" />
          New Estimate
        </Button>
      </div>

      {result.items.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground text-sm">No estimates yet.</p>
          <Button variant="outline" size="sm" className="mt-4" render={<Link href="/estimates/new" />}>
            Create first estimate
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Number</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Vehicle</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {result.items.map((est) => (
                <tr
                  key={est.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-medium">
                    <Link href={`/estimates/${est.id}`} className="hover:underline">
                      {est.estimateNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/estimates/${est.id}`} className="block">
                      {est.customer.firstName} {est.customer.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {est.vehicle.year ? `${est.vehicle.year} ` : ""}{est.vehicle.make} {est.vehicle.model}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={STATUS_COLORS[est.status] ?? ""}
                    >
                      {STATUS_LABELS[est.status] ?? est.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {formatCurrency(est.total.toNumber())}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {formatDate(est.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
