"use client"

import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Search, ChevronLeft, ChevronRight, Car } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatPhone, formatDate, formatCurrency } from "@/lib/utils/format"
import { useTransition, useState } from "react"

type Customer = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  tags: string[]
  _count: { vehicles: number }
  workOrders: { createdAt: Date }[]
  invoices: { amountDue: { toNumber(): number } }[]
}

export function CustomerTable({
  data,
  total,
  page,
  totalPages,
  search,
}: {
  data: Customer[]
  total: number
  page: number
  totalPages: number
  search: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(search)

  function navigate(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams()
    if (params.search) sp.set("search", params.search)
    if (params.page && params.page !== "1") sp.set("page", params.page)
    startTransition(() => {
      router.push(`${pathname}?${sp.toString()}`)
    })
  }

  function handleSearch(value: string) {
    setSearchValue(value)
    navigate({ search: value || undefined, page: "1" })
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, email…"
          className="pl-9"
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Vehicles</TableHead>
              <TableHead className="hidden lg:table-cell">Last Visit</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Balance</TableHead>
              <TableHead className="hidden xl:table-cell">Tags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  {search
                    ? "No customers match your search."
                    : "No customers yet. Add your first customer."}
                </TableCell>
              </TableRow>
            ) : (
              data.map((customer) => {
                const lastVisit = customer.workOrders[0]?.createdAt ?? null
                const openBalance = customer.invoices.reduce(
                  (sum, inv) => sum + inv.amountDue.toNumber(),
                  0
                )
                return (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/customers/${customer.id}`)}
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={`/customers/${customer.id}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {customer.lastName}, {customer.firstName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatPhone(customer.phone)}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">
                      {customer.email ?? "—"}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Car className="h-3.5 w-3.5" />
                        {customer._count.vehicles}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                      {lastVisit ? formatDate(lastVisit) : "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-right">
                      {openBalance > 0 ? (
                        <span className="text-sm font-medium text-destructive tabular-nums">
                          {formatCurrency(openBalance)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {customer.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isPending}
              onClick={() => navigate({ search: search || undefined, page: String(page - 1) })}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isPending}
              onClick={() => navigate({ search: search || undefined, page: String(page + 1) })}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
