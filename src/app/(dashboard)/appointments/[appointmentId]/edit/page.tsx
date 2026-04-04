import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
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
import { updateAppointment, deleteAppointment } from "@/modules/appointments/actions"
import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

export const metadata: Metadata = { title: "Edit Appointment" }

function toDatetimeLocal(date: Date): string {
  // Format as YYYY-MM-DDTHH:mm in local time
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

export default async function EditAppointmentPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>
}) {
  const { appointmentId } = await params
  const { tenantId } = await requireAuth()

  const [apt, technicians] = await Promise.all([
    prisma.appointment.findFirst({ where: { id: appointmentId, tenantId } }),
    prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: "asc" }],
    }),
  ])
  if (!apt) notFound()

  const updateWithId = updateAppointment.bind(null, appointmentId)
  const deleteWithId = deleteAppointment.bind(null, appointmentId)

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" render={<Link href="/appointments" />}>
          <ChevronLeft className="h-4 w-4" />
          Appointments
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Appointment</h1>
      </div>

      <EstimateFormShell
        action={updateWithId}
        submitLabel="Save Changes"
        cancelSlot={
          <Button type="button" variant="outline" render={<Link href="/appointments" />}>
            Cancel
          </Button>
        }
        deleteSlot={
          <form
            action={async () => {
              "use server"
              await deleteWithId()
            }}
            onSubmit={(e) => {
              if (!confirm("Delete this appointment? This cannot be undone.")) e.preventDefault()
            }}
          >
            <Button type="submit" variant="destructive" size="sm">
              Delete
            </Button>
          </form>
        }
      >
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-medium">Details</h2>

          <div className="space-y-2">
            <Label htmlFor="title">Service / Title *</Label>
            <Input
              id="title"
              name="title"
              defaultValue={apt.title}
              placeholder="Oil change, brake inspection…"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start time *</Label>
              <Input
                id="startTime"
                name="startTime"
                type="datetime-local"
                defaultValue={toDatetimeLocal(apt.startTime)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End time *</Label>
              <Input
                id="endTime"
                name="endTime"
                type="datetime-local"
                defaultValue={toDatetimeLocal(apt.endTime)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedToId">Assign technician</Label>
            <Select name="assignedToId" defaultValue={apt.assignedToId ?? ""}>
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
            <Textarea
              id="description"
              name="description"
              defaultValue={apt.description ?? ""}
              placeholder="Customer concerns, vehicle info…"
              rows={2}
            />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-medium">Customer Info</h2>

          <div className="space-y-2">
            <Label htmlFor="customerName">Name *</Label>
            <Input id="customerName" name="customerName" defaultValue={apt.customerName} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                name="customerPhone"
                type="tel"
                defaultValue={apt.customerPhone ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                name="customerEmail"
                type="email"
                defaultValue={apt.customerEmail ?? ""}
              />
            </div>
          </div>
        </div>
      </EstimateFormShell>
    </div>
  )
}
