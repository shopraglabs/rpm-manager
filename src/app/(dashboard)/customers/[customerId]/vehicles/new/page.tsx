import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VehicleForm } from "@/components/forms/vehicle-form"
import { getCustomer } from "@/modules/customers/queries"
import { createVehicle } from "@/modules/vehicles/actions"

export const metadata: Metadata = { title: "Add Vehicle" }

export default async function NewVehiclePage({
  params,
}: {
  params: Promise<{ customerId: string }>
}) {
  const { customerId } = await params
  const customer = await getCustomer(customerId)
  if (!customer) notFound()

  const createWithCustomer = createVehicle.bind(null, customerId)

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" render={<Link href={`/customers/${customerId}`} />}>
          <ChevronLeft className="h-4 w-4" />
          {customer.firstName} {customer.lastName}
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Add Vehicle</h1>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <VehicleForm action={createWithCustomer} />
      </div>
    </div>
  )
}
