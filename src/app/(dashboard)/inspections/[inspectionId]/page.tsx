import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, CheckCircle2, Send, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getInspection } from "@/modules/inspections/queries"
import {
  completeInspection,
  sendInspectionToCustomer,
  updateInspectionNotes,
} from "@/modules/inspections/actions"
import { InspectionItemRow } from "./inspection-item-row"
import { CONDITION_LABELS, CONDITION_COLORS } from "@/modules/inspections/templates"
import { formatDateTime } from "@/lib/utils/format"

export const metadata: Metadata = { title: "Inspection" }

const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  SENT: "Sent to Customer",
  VIEWED: "Viewed by Customer",
}

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: "bg-yellow-50 text-yellow-700 border-yellow-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
  SENT: "bg-blue-50 text-blue-700 border-blue-200",
  VIEWED: "bg-purple-50 text-purple-700 border-purple-200",
}

export default async function InspectionPage({
  params,
}: {
  params: Promise<{ inspectionId: string }>
}) {
  const { inspectionId } = await params
  const inspection = await getInspection(inspectionId)
  if (!inspection) notFound()

  const isEditable = inspection.status === "IN_PROGRESS"

  // Group items by category
  const byCategory = inspection.items.reduce<Record<string, typeof inspection.items>>(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    },
    {}
  )

  // Summary counts
  const counts = inspection.items.reduce(
    (acc, item) => {
      acc[item.condition] = (acc[item.condition] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const completeWithId = completeInspection.bind(null, inspectionId)
  const sendWithId = sendInspectionToCustomer.bind(null, inspectionId)
  const notesWithId = updateInspectionNotes.bind(null, inspectionId)

  const shareUrl = inspection.shareToken
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/customer-portal/inspection/${inspection.shareToken}`
    : null

  return (
    <div className="max-w-3xl">
      {/* Back */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href={`/work-orders/${inspection.workOrder.id}`} />}
        >
          <ChevronLeft className="h-4 w-4" />
          {inspection.workOrder.orderNumber}
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-muted-foreground" />
              Vehicle Inspection
            </h1>
            <Badge variant="outline" className={STATUS_COLORS[inspection.status] ?? ""}>
              {STATUS_LABELS[inspection.status] ?? inspection.status}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {inspection.vehicle.year ? `${inspection.vehicle.year} ` : ""}
            {inspection.vehicle.make} {inspection.vehicle.model}
            {inspection.vehicle.licensePlate ? ` · ${inspection.vehicle.licensePlate}` : ""}
            {" · "}Tech: {inspection.technician.firstName} {inspection.technician.lastName}
          </p>
          {inspection.completedAt && (
            <p className="text-muted-foreground text-xs mt-0.5">
              Completed {formatDateTime(inspection.completedAt)}
            </p>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          {isEditable && (
            <form
              action={async () => {
                await completeWithId()
              }}
            >
              <Button type="submit" variant="outline" size="sm">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            </form>
          )}
          {(inspection.status === "COMPLETED" ||
            inspection.status === "SENT" ||
            inspection.status === "VIEWED") && (
            <form
              action={async () => {
                await sendWithId()
              }}
            >
              <Button type="submit" size="sm">
                <Send className="h-4 w-4 mr-2" />
                {inspection.sentToCustomer ? "Resend Link" : "Send to Customer"}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex gap-2 mb-6">
        {(["GOOD", "FAIR", "POOR", "URGENT"] as const).map((c) => {
          const count = counts[c] ?? 0
          if (count === 0) return null
          const colors = CONDITION_COLORS[c]
          return (
            <div
              key={c}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${colors.bg} ${colors.text} ${colors.border}`}
            >
              <span className="text-base font-bold tabular-nums">{count}</span>
              {CONDITION_LABELS[c]}
            </div>
          )
        })}
      </div>

      {/* Share link (if sent) */}
      {shareUrl && (
        <div className="rounded-xl border bg-muted/40 px-4 py-3 mb-6 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5">Customer link</p>
            <p className="text-sm font-mono truncate">{shareUrl}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={undefined}
            render={<a href={shareUrl} target="_blank" rel="noopener noreferrer" />}
          >
            Open
          </Button>
        </div>
      )}

      {/* Inspection items by category */}
      <div className="space-y-4">
        {Object.entries(byCategory).map(([category, items]) => (
          <div key={category} className="rounded-xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30">
              <h2 className="font-medium text-sm">{category}</h2>
            </div>
            <div className="divide-y">
              {items.map((item) => (
                <InspectionItemRow
                  key={item.id}
                  item={{
                    id: item.id,
                    name: item.name,
                    condition: item.condition,
                    notes: item.notes,
                  }}
                  readOnly={!isEditable}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Overall notes */}
      <div className="mt-6 rounded-xl border bg-card p-5">
        <h2 className="font-medium text-sm mb-3">Overall Notes</h2>
        {isEditable ? (
          <form
            action={async (fd) => {
              await notesWithId(fd)
            }}
          >
            <textarea
              name="notes"
              defaultValue={inspection.notes ?? ""}
              placeholder="General observations, recommendations…"
              rows={4}
              className="w-full text-sm bg-muted/40 border rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground mb-3"
            />
            <Button type="submit" size="sm" variant="outline">
              Save Notes
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {inspection.notes ?? "No overall notes."}
          </p>
        )}
      </div>
    </div>
  )
}
