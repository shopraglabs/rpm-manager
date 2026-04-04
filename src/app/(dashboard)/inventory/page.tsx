import type { Metadata } from "next"
import Link from "next/link"
import { Plus, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchBar } from "@/components/ui/search-bar"
import { PaginationNav } from "@/components/ui/pagination-nav"
import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { formatCurrency } from "@/lib/utils/format"
import { PAGINATION_PAGE_SIZE } from "@/lib/utils/constants"

export const metadata: Metadata = { title: "Inventory" }

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; low?: string }>
}) {
  const { page, search, low } = await searchParams
  const { tenantId } = await requireAuth()
  const currentPage = page ? parseInt(page) : 1

  const searchWhere = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { partNumber: { contains: search, mode: "insensitive" as const } },
          { brand: { contains: search, mode: "insensitive" as const } },
          { category: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {}

  const itemsWhere = {
    tenantId,
    isActive: true,
    ...(low === "1" && { quantityOnHand: { lte: 5 } }),
    ...searchWhere,
  }

  const [items, filteredTotal, total, lowStockCount] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: itemsWhere,
      orderBy: { name: "asc" },
      skip: (currentPage - 1) * PAGINATION_PAGE_SIZE,
      take: PAGINATION_PAGE_SIZE,
    }),
    prisma.inventoryItem.count({ where: itemsWhere }),
    prisma.inventoryItem.count({ where: { tenantId, isActive: true } }),
    prisma.inventoryItem.count({
      where: { tenantId, isActive: true, quantityOnHand: { lte: 0 } },
    }),
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {total} part{total !== 1 ? "s" : ""}
            {lowStockCount > 0 && (
              <span className="ml-2 text-orange-600 font-medium">
                · {lowStockCount} low / out of stock
              </span>
            )}
          </p>
        </div>
        <Button render={<Link href="/inventory/new" />}>
          <Plus className="h-4 w-4 mr-2" />
          Add Part
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <SearchBar placeholder="Search parts, SKU, brand…" initialValue={search ?? ""} />
        {lowStockCount > 0 && (
          <Button
            variant={low === "1" ? "default" : "outline"}
            size="sm"
            render={<Link href={low === "1" ? "/inventory" : "/inventory?low=1"} />}
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
            Low stock
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground text-sm">No inventory items yet.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            render={<Link href="/inventory/new" />}
          >
            Add first part
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Part</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  Brand
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                  Category
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Stock</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  Cost
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => {
                const isLow = item.quantityOnHand <= item.reorderPoint
                const isOut = item.quantityOnHand === 0
                return (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/inventory/${item.id}`} className="block">
                        <p className="font-medium hover:underline">{item.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{item.partNumber}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {item.brand ?? "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {item.category ? (
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {(isOut || isLow) && (
                          <AlertTriangle
                            className={`h-3.5 w-3.5 ${isOut ? "text-destructive" : "text-orange-500"}`}
                          />
                        )}
                        <span
                          className={`font-medium tabular-nums ${isOut ? "text-destructive" : isLow ? "text-orange-600" : ""}`}
                        >
                          {item.quantityOnHand}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground hidden md:table-cell">
                      {formatCurrency(item.cost.toNumber())}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {formatCurrency(item.price.toNumber())}
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
        totalPages={Math.ceil(filteredTotal / PAGINATION_PAGE_SIZE)}
        total={filteredTotal}
        pageSize={PAGINATION_PAGE_SIZE}
        buildHref={(p) => {
          const sp = new URLSearchParams()
          sp.set("page", String(p))
          if (search) sp.set("search", search)
          if (low) sp.set("low", low)
          return `/inventory?${sp.toString()}`
        }}
      />
    </div>
  )
}
