"use client"

import { useState } from "react"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getNextStatuses } from "@/modules/work-orders/workflow"
import { transitionStatus } from "@/modules/work-orders/actions"
import type { WorkOrderStatus } from "@/generated/prisma/enums"

export const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  PENDING: "Pending",
  CHECKED_IN: "Checked In",
  IN_PROGRESS: "In Progress",
  WAITING_PARTS: "Waiting Parts",
  WAITING_APPROVAL: "Waiting Approval",
  QUALITY_CHECK: "Quality Check",
  COMPLETED: "Completed",
  READY_FOR_PICKUP: "Ready for Pickup",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Updating…" : "Update Status"}
    </Button>
  )
}

export function StatusTransition({
  workOrderId,
  currentStatus,
}: {
  workOrderId: string
  currentStatus: WorkOrderStatus
}) {
  const nextStatuses = getNextStatuses(currentStatus)
  const [selected, setSelected] = useState<string>(nextStatuses[0] ?? "")

  const [state, formAction] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      const result = await transitionStatus(workOrderId, formData)
      return result ?? null
    },
    null
  )

  if (nextStatuses.length === 0) return null

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="font-medium text-sm mb-3">Update Status</h3>

      {state?.error && (
        <p className="text-sm text-destructive mb-3">{state.error}</p>
      )}

      <form action={formAction} className="space-y-3">
        {/* Hidden input carries the selected value */}
        <input type="hidden" name="toStatus" value={selected} />

        <Select value={selected} onValueChange={(v) => v !== null && setSelected(v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select next status…" />
          </SelectTrigger>
          <SelectContent>
            {nextStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABELS[status] ?? status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Textarea
          name="note"
          placeholder="Add a note about this status change (optional)…"
          rows={2}
          className="text-sm"
        />

        <SubmitButton />
      </form>
    </div>
  )
}
