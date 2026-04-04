import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CustomerForm } from "@/components/forms/customer-form"
import { getCustomer } from "@/modules/customers/queries"
import { updateCustomer, deleteCustomer } from "@/modules/customers/actions"

export const metadata: Metadata = { title: "Edit Customer" }

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ customerId: string }>
}) {
  const { customerId } = await params
  const customer = await getCustomer(customerId)
  if (!customer) notFound()

  const updateWithId = updateCustomer.bind(null, customerId)
  const deleteWithId = deleteCustomer.bind(null, customerId)

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" render={<Link href={`/customers/${customerId}`} />}>
          <ChevronLeft className="h-4 w-4" />
          {customer.firstName} {customer.lastName}
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Customer</h1>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <CustomerForm action={updateWithId} defaultValues={customer} deleteAction={deleteWithId} />
      </div>
    </div>
  )
}
