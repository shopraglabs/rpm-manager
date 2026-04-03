import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EstimateFormShell } from "@/components/estimates/estimate-form-shell"
import { createAppointment } from "@/modules/appointments/actions"
import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

export const metadata: Metadata = { title: "New Appointment" }

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date } = await searchParams
  const { tenantId } = await requireAuth()

  const technicians = await prisma.user.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ firstName: "asc" }],
  })

  // Default start = today 9am, end = today 10am
  const defaultDate = date ?? new Date().toISOString().split("T")[0]
  const defaultStart = `${defaultDate}T09:00`
  const defaultEnd = `${defaultDate}T10:00`

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" render={<Link href="/appointments" />}>
          <ChevronLeft className="h-4 w-4" />
          Appointments
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">New Appointment</h1>
      </div>

      <EstimateFormShell
        action={createAppointment}
        submitLabel="Schedule Appointment"
        cancelSlot={
          <Button type="button" variant="outline" render={<Link href="/appointments" />}>
            Cancel
          </Button>
        }
      >
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-medium">Details</h2>

          <div className="space-y-2">
            <Label htmlFor="title">Service / Title *</Label>
            <Input id="title" name="title" placeholder="Oil change, brake inspection…" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start time *</Label>
              <Input id="startTime" name="startTime" type="datetime-local" defaultValue={defaultStart} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End time *</Label>
              <Input id="endTime" name="endTime" type="datetime-local" defaultValue={defaultEnd} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedToId">Assign technician</Label>
            <Select name="assignedToId" defaultValue="">
              <SelectTrigger id="assignedToId">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                {technicians.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.firstName} {t.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Notes</Label>
            <Textarea id="description" name="description" placeholder="Customer concerns, vehicle info…" rows={2} />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-medium">Customer Info</h2>

          <div className="space-y-2">
            <Label htmlFor="customerName">Name *</Label>
            <Input id="customerName" name="customerName" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone</Label>
              <Input id="customerPhone" name="customerPhone" type="tel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email</Label>
              <Input id="customerEmail" name="customerEmail" type="email" />
            </div>
          </div>
        </div>
      </EstimateFormShell>
    </div>
  )
}
