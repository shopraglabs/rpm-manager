import type { Metadata } from "next"
import Link from "next/link"
import { Plus, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCustomers } from "@/modules/customers/queries"
import { CustomerTable } from "./customer-table"

export const metadata: Metadata = { title: "Customers" }

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const { page, search } = await searchParams
  const result = await getCustomers({
    page: page ? parseInt(page) : 1,
    search: search ?? undefined,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {result.total} customer{result.total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" render={<Link href="/customers/import" />}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button render={<Link href="/customers/new" />}>
            <Plus className="h-4 w-4 mr-2" />
            New Customer
          </Button>
        </div>
      </div>

      <CustomerTable
        data={result.items}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        search={search ?? ""}
      />
    </div>
  )
}
