import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ClipboardList } from "lucide-react"
import { getInspectionByToken } from "@/modules/inspections/queries"
import { CONDITION_LABELS, CONDITION_COLORS } from "@/modules/inspections/templates"
import { prisma } from "@/lib/db"

export const metadata: Metadata = { title: "Vehicle Inspection Report" }

export default async function CustomerInspectionPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const inspection = await getInspectionByToken(token)
  if (!inspection) notFound()

  // Mark as viewed if not already
  if (inspection.status === "SENT") {
    await prisma.inspection.update({
      where: { id: inspection.id },
      data: { status: "VIEWED", customerViewedAt: new Date() },
    })
  }

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

  const vehicleLabel = [
    inspection.vehicle.year,
    inspection.vehicle.make,
    inspection.vehicle.model,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-semibold">Vehicle Inspection Report</h1>
            <p className="text-sm text-muted-foreground">
              Inspected by {inspection.technician.firstName} {inspection.technician.lastName}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Vehicle info */}
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Vehicle</p>
          <p className="font-semibold text-lg">{vehicleLabel || "Unknown vehicle"}</p>
          {inspection.vehicle.licensePlate && (
            <p className="text-sm text-muted-foreground font-mono">{inspection.vehicle.licensePlate}</p>
          )}
        </div>

        {/* Summary */}
        <div className="flex flex-wrap gap-2">
          {(["GOOD", "FAIR", "POOR", "URGENT"] as const).map((c) => {
            const count = counts[c] ?? 0
            if (count === 0) return null
            const colors = CONDITION_COLORS[c]
            return (
              <div
                key={c}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium ${colors.bg} ${colors.text} ${colors.border}`}
              >
                <span className="text-xl font-bold tabular-nums">{count}</span>
                {CONDITION_LABELS[c]}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Condition Guide</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
              <span><strong>Good</strong> — No action needed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500 shrink-0" />
              <span><strong>Fair</strong> — Monitor, service soon</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />
              <span><strong>Poor</strong> — Service recommended</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
              <span><strong>Urgent</strong> — Immediate attention</span>
            </div>
          </div>
        </div>

        {/* Items by category */}
        {Object.entries(byCategory).map(([category, items]) => (
          <div key={category} className="rounded-xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30">
              <h2 className="font-medium text-sm">{category}</h2>
            </div>
            <div className="divide-y">
              {items.map((item) => {
                const colors = CONDITION_COLORS[item.condition] ?? CONDITION_COLORS.GOOD
                return (
                  <div key={item.id} className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex-1 text-sm">{item.name}</span>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border shrink-0 ${colors.bg} ${colors.text} ${colors.border}`}>
                        {CONDITION_LABELS[item.condition] ?? item.condition}
                      </span>
                    </div>
                    {item.notes && (
                      <p className="mt-1.5 text-xs text-muted-foreground">{item.notes}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Overall notes */}
        {inspection.notes && (
          <div className="rounded-xl border bg-card p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Technician Notes</p>
            <p className="text-sm whitespace-pre-wrap">{inspection.notes}</p>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground pb-8">
          Questions? Contact your service advisor.
        </p>
      </main>
    </div>
  )
}
