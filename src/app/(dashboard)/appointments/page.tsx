import type { Metadata } from "next"
import Link from "next/link"
import { Bell, Pencil, Plus, ChevronLeft, ChevronRight, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import {
  updateAppointmentStatus,
  deleteAppointment,
  sendAppointmentReminder,
} from "@/modules/appointments/actions"

export const metadata: Metadata = { title: "Appointments" }

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700 border-blue-200",
  CONFIRMED: "bg-green-50 text-green-700 border-green-200",
  ARRIVED: "bg-yellow-50 text-yellow-700 border-yellow-200",
  NO_SHOW: "bg-red-50 text-red-700 border-red-200",
  COMPLETED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-muted text-muted-foreground",
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Scheduled",
  CONFIRMED: "Confirmed",
  ARRIVED: "Arrived",
  NO_SHOW: "No Show",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function parseDate(str: string | undefined, fallback: Date): Date {
  if (!str) return fallback
  const d = new Date(str + "T00:00:00")
  return isNaN(d.getTime()) ? fallback : d
}

/** Returns Monday of the week containing `date`. */
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  // JS: 0=Sun, 1=Mon...6=Sat  →  shift so Mon=0
  const offset = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - offset)
  return d
}

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0]
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date: dateParam } = await searchParams
  const { tenantId } = await requireAuth()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const viewDate = parseDate(dateParam, today)
  viewDate.setHours(0, 0, 0, 0)

  // Week strip: Mon–Sun containing viewDate
  const weekStart = getWeekStart(viewDate)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  // Build the 7 day objects
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const prevWeekStart = new Date(weekStart)
  prevWeekStart.setDate(prevWeekStart.getDate() - 7)
  const nextWeekStart = new Date(weekStart)
  nextWeekStart.setDate(nextWeekStart.getDate() + 7)

  // Prev / next day for day nav
  const prevDate = new Date(viewDate)
  prevDate.setDate(prevDate.getDate() - 1)
  const nextDate = new Date(viewDate)
  nextDate.setDate(nextDate.getDate() + 1)

  // Fetch appointment counts for the week (exclude cancelled/no-show for the dots)
  const weekAppts = await prisma.appointment.findMany({
    where: {
      tenantId,
      startTime: { gte: weekStart, lt: weekEnd },
    },
    select: { startTime: true, status: true },
  })

  const countByDay: Record<string, number> = {}
  weekAppts.forEach((apt) => {
    if (["CANCELLED", "NO_SHOW"].includes(apt.status)) return
    const key = toDateStr(apt.startTime)
    countByDay[key] = (countByDay[key] ?? 0) + 1
  })

  // Fetch appointments for the selected day
  const dayStart = new Date(viewDate)
  const dayEnd = new Date(viewDate)
  dayEnd.setHours(23, 59, 59, 999)

  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      startTime: { gte: dayStart, lte: dayEnd },
    },
    orderBy: { startTime: "asc" },
    include: {
      assignedTo: { select: { firstName: true, lastName: true } },
      vehicle: { select: { year: true, make: true, model: true, customerId: true } },
    },
  })

  const isToday = viewDate.getTime() === today.getTime()
  const viewDateStr = toDateStr(viewDate)
  const todayStr = toDateStr(today)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {viewDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            {isToday && <span className="ml-2 text-primary font-medium">Today</span>}
          </p>
        </div>
        <Button render={<Link href={`/appointments/new?date=${viewDateStr}`} />}>
          <Plus className="h-4 w-4 mr-2" />
          New Appointment
        </Button>
      </div>

      {/* Week strip */}
      <div className="rounded-xl border bg-card mb-6 overflow-hidden">
        {/* Week nav header */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            render={<Link href={`/appointments?date=${toDateStr(prevWeekStart)}`} />}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              {" – "}
              {weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            {viewDateStr !== todayStr && (
              <Link
                href="/appointments"
                className="text-xs text-primary hover:underline"
              >
                Today
              </Link>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            render={<Link href={`/appointments?date=${toDateStr(nextWeekStart)}`} />}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {weekDays.map((day, i) => {
            const dayStr = toDateStr(day)
            const isSelected = dayStr === viewDateStr
            const isTodayDay = dayStr === todayStr
            const count = countByDay[dayStr] ?? 0

            return (
              <Link
                key={dayStr}
                href={`/appointments?date=${dayStr}`}
                className={`flex flex-col items-center py-3 transition-colors border-r last:border-r-0 ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted/50"
                }`}
              >
                <span
                  className={`text-[10px] font-medium uppercase tracking-wide mb-1 ${
                    isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                  }`}
                >
                  {DAY_NAMES[i]}
                </span>
                <span
                  className={`text-sm font-semibold leading-none ${
                    isTodayDay && !isSelected
                      ? "text-primary"
                      : isSelected
                        ? "text-primary-foreground"
                        : ""
                  }`}
                >
                  {day.getDate()}
                </span>
                {count > 0 ? (
                  <span
                    className={`mt-1.5 text-[10px] font-medium rounded-full px-1.5 py-0.5 leading-none ${
                      isSelected
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {count}
                  </span>
                ) : (
                  <span className="mt-1.5 h-[18px]" />
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Day navigation — prev/next */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/appointments?date=${toDateStr(prevDate)}`} />}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/appointments?date=${toDateStr(nextDate)}`} />}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day view */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {appointments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground text-sm">No appointments scheduled.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              render={<Link href={`/appointments/new?date=${viewDateStr}`} />}
            >
              Schedule appointment
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {appointments.map((apt) => {
              const start = new Date(apt.startTime)
              const end = new Date(apt.endTime)
              const duration = Math.round((end.getTime() - start.getTime()) / 60000)

              const confirmWithId = updateAppointmentStatus.bind(null, apt.id, "CONFIRMED")
              const arrivedWithId = updateAppointmentStatus.bind(null, apt.id, "ARRIVED")
              const noShowWithId = updateAppointmentStatus.bind(null, apt.id, "NO_SHOW")
              const deleteWithId = deleteAppointment.bind(null, apt.id)
              const reminderWithId = sendAppointmentReminder.bind(null, apt.id)

              return (
                <div key={apt.id} className="px-5 py-4 flex items-start gap-4">
                  {/* Time column */}
                  <div className="w-20 shrink-0 text-sm">
                    <p className="font-medium">
                      {start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </p>
                    <p className="text-xs text-muted-foreground">{duration} min</p>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{apt.title}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[apt.status] ?? ""}`}
                      >
                        {STATUS_LABELS[apt.status] ?? apt.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{apt.customerName}</p>
                    {apt.customerPhone && (
                      <p className="text-xs text-muted-foreground">{apt.customerPhone}</p>
                    )}
                    {apt.vehicle && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {apt.vehicle.year ? `${apt.vehicle.year} ` : ""}
                        {apt.vehicle.make} {apt.vehicle.model}
                      </p>
                    )}
                    {apt.assignedTo && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Assigned: {apt.assignedTo.firstName} {apt.assignedTo.lastName}
                      </p>
                    )}
                    {apt.description && (
                      <p className="text-xs text-muted-foreground mt-1 italic">{apt.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    {/* Edit */}
                    <Button
                      variant="ghost"
                      size="sm"
                      render={<Link href={`/appointments/${apt.id}/edit`} />}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {/* SMS reminder */}
                    {apt.customerPhone && ["SCHEDULED", "CONFIRMED"].includes(apt.status) && (
                      <form
                        action={async () => {
                          "use server"
                          await reminderWithId()
                        }}
                        title="Send SMS reminder"
                      >
                        <Button type="submit" size="sm" variant="ghost">
                          <Bell className="h-3.5 w-3.5" />
                        </Button>
                      </form>
                    )}
                    {apt.status === "SCHEDULED" && (
                      <form
                        action={async () => {
                          await confirmWithId()
                        }}
                      >
                        <Button type="submit" size="sm" variant="outline">
                          Confirm
                        </Button>
                      </form>
                    )}
                    {apt.status === "CONFIRMED" && (
                      <form
                        action={async () => {
                          await arrivedWithId()
                        }}
                      >
                        <Button type="submit" size="sm" variant="outline">
                          Arrived
                        </Button>
                      </form>
                    )}
                    {apt.status === "ARRIVED" && apt.vehicleId && apt.vehicle?.customerId && (
                      <Button
                        size="sm"
                        render={
                          <Link
                            href={`/work-orders/new?vehicleId=${apt.vehicleId}&customerId=${apt.vehicle.customerId}`}
                          />
                        }
                      >
                        <Wrench className="h-3.5 w-3.5 mr-1.5" />
                        Create WO
                      </Button>
                    )}
                    {["SCHEDULED", "CONFIRMED"].includes(apt.status) && (
                      <form
                        action={async () => {
                          await noShowWithId()
                        }}
                      >
                        <Button type="submit" size="sm" variant="destructive">
                          No Show
                        </Button>
                      </form>
                    )}
                    {!["COMPLETED", "CANCELLED", "NO_SHOW"].includes(apt.status) && (
                      <form
                        action={async () => {
                          await deleteWithId()
                        }}
                        onSubmit={(e) => {
                          if (!confirm("Delete this appointment?")) e.preventDefault()
                        }}
                      >
                        <Button
                          type="submit"
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          ×
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
