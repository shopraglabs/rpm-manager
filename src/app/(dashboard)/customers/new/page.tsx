import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CustomerForm } from "@/components/forms/customer-form"
import { createCustomer } from "@/modules/customers/actions"

export const metadata: Metadata = { title: "New Customer" }

export default function NewCustomerPage() {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" render={<Link href="/customers" />}>
          <ChevronLeft className="h-4 w-4" />
          Customers
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">New Customer</h1>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <CustomerForm action={createCustomer} />
      </div>
    </div>
  )
}
