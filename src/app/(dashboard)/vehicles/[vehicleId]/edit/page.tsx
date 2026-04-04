import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VehicleForm } from "@/components/forms/vehicle-form"
import { getVehicle } from "@/modules/vehicles/queries"
import { updateVehicle, deleteVehicle } from "@/modules/vehicles/actions"

export const metadata: Metadata = { title: "Edit Vehicle" }

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ vehicleId: string }>
}) {
  const { vehicleId } = await params
  const vehicle = await getVehicle(vehicleId)
  if (!vehicle) notFound()

  const updateWithId = updateVehicle.bind(null, vehicleId)
  const deleteWithId = deleteVehicle.bind(null, vehicleId)

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" render={<Link href={`/vehicles/${vehicleId}`} />}>
          <ChevronLeft className="h-4 w-4" />
          {vehicle.year ? `${vehicle.year} ` : ""}
          {vehicle.make} {vehicle.model}
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Vehicle</h1>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <VehicleForm action={updateWithId} defaultValues={vehicle} deleteAction={deleteWithId} />
      </div>
    </div>
  )
}
