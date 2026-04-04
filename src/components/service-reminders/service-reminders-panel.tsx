"use client"

import { useState, useTransition } from "react"
import { CheckCircle2, Trash2, Plus, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  createServiceReminder,
  completeServiceReminder,
  deleteServiceReminder,
} from "@/modules/service-reminders/actions"
import { formatDate } from "@/lib/utils/format"

type Reminder = {
  id: string
  service: string
  dueDate: Date | null
  dueMileage: number | null
  notes: string | null
  isCompleted: boolean
  completedAt: Date | null
}

const COMMON_SERVICES = [
  "Oil Change",
  "Tire Rotation",
  "Brake Inspection",
  "Air Filter",
  "Cabin Filter",
  "Transmission Service",
  "Coolant Flush",
  "Spark Plugs",
  "Timing Belt",
  "Wheel Alignment",
]

export function ServiceRemindersPanel({
  vehicleId,
  initialReminders,
}: {
  vehicleId: string
  initialReminders: Reminder[]
}) {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleAdd(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createServiceReminder(vehicleId, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setShowForm(false)
        // Optimistic: refresh handled by revalidatePath server-side
      }
    })
  }

  function handleComplete(id: string) {
    startTransition(async () => {
      await completeServiceReminder(id, vehicleId)
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isCompleted: true, completedAt: new Date() } : r))
      )
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteServiceReminder(id, vehicleId)
      setReminders((prev) => prev.filter((r) => r.id !== id))
    })
  }

  const active = reminders.filter((r) => !r.isCompleted)
  const completed = reminders.filter((r) => r.isCompleted)

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">Service Reminders</h3>
          {active.length > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 rounded-full px-1.5 py-0.5 font-medium">
              {active.length}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="px-5 py-4 border-b bg-muted/20">
          <form action={handleAdd} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Service *</Label>
              <Input
                name="service"
                list="common-services"
                placeholder="e.g. Oil Change"
                className="h-8 text-sm"
                required
              />
              <datalist id="common-services">
                {COMMON_SERVICES.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Due date</Label>
                <Input name="dueDate" type="date" className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Due mileage</Label>
                <Input
                  name="dueMileage"
                  type="number"
                  min="1"
                  placeholder="e.g. 75000"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes (optional)</Label>
              <Input name="notes" placeholder="Additional details…" className="h-8 text-sm" />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="h-7 text-xs" disabled={isPending}>
                {isPending ? "Saving…" : "Save Reminder"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setShowForm(false)
                  setError(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Active reminders */}
      {active.length === 0 && !showForm ? (
        <div className="px-5 py-6 text-center text-xs text-muted-foreground">
          No upcoming service reminders.
        </div>
      ) : (
        <ul className="divide-y">
          {active.map((reminder) => (
            <li key={reminder.id} className="flex items-start gap-3 px-5 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{reminder.service}</p>
                <div className="flex flex-wrap items-center gap-x-2 mt-0.5">
                  {reminder.dueDate && (
                    <span className="text-xs text-muted-foreground">
                      Due {formatDate(reminder.dueDate)}
                    </span>
                  )}
                  {reminder.dueMileage && (
                    <span className="text-xs text-muted-foreground">
                      {reminder.dueDate ? "· " : ""}
                      {reminder.dueMileage.toLocaleString()} mi
                    </span>
                  )}
                </div>
                {reminder.notes && (
                  <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">
                    {reminder.notes}
                  </p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                  title="Mark done"
                  disabled={isPending}
                  onClick={() => handleComplete(reminder.id)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  title="Delete"
                  disabled={isPending}
                  onClick={() => handleDelete(reminder.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Completed (collapsed) */}
      {completed.length > 0 && (
        <details className="border-t">
          <summary className="px-5 py-3 text-xs text-muted-foreground cursor-pointer hover:bg-muted/20 list-none flex items-center gap-1">
            <span className="select-none">▸</span> {completed.length} completed
          </summary>
          <ul className="divide-y">
            {completed.map((reminder) => (
              <li key={reminder.id} className="flex items-start gap-3 px-5 py-2.5 opacity-60">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium line-through">{reminder.service}</p>
                  {reminder.completedAt && (
                    <p className="text-xs text-muted-foreground">
                      Completed {formatDate(reminder.completedAt)}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
