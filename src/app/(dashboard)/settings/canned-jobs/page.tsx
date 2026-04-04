import type { Metadata } from "next"
import Link from "next/link"
import { Plus, Pencil, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCannedJobs } from "@/modules/canned-jobs/queries"
import { deleteCannedJob, toggleCannedJobActive } from "@/modules/canned-jobs/actions"
import { formatCurrency } from "@/lib/utils/format"
import { requireAuth } from "@/lib/auth/session"

export const metadata: Metadata = { title: "Canned Jobs" }

const TYPE_LABELS: Record<string, string> = {
  LABOR: "Labor",
  PART: "Part",
  SUBLET: "Sublet",
  FEE: "Fee",
  DISCOUNT: "Discount",
}

const TYPE_COLORS: Record<string, string> = {
  LABOR: "bg-blue-50 text-blue-700 border-blue-200",
  PART: "bg-purple-50 text-purple-700 border-purple-200",
  SUBLET: "bg-orange-50 text-orange-700 border-orange-200",
  FEE: "bg-yellow-50 text-yellow-700 border-yellow-200",
  DISCOUNT: "bg-red-50 text-red-700 border-red-200",
}

export default async function CannedJobsPage() {
  const { role } = await requireAuth()
  const canEdit = role === "OWNER"
  const jobs = await getCannedJobs()

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" render={<Link href="/settings" />}>
          <ChevronLeft className="h-4 w-4" />
          Settings
        </Button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Canned Jobs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Service templates for quickly adding line items to estimates and work orders.
          </p>
        </div>
        {canEdit && (
          <Button render={<Link href="/settings/canned-jobs/new" />}>
            <Plus className="h-4 w-4 mr-2" />
            New Canned Job
          </Button>
        )}
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground text-sm">No canned jobs yet.</p>
          {canEdit && (
            <Button className="mt-4" render={<Link href="/settings/canned-jobs/new" />}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first canned job
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-3 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  Type
                </th>
                <th className="text-right px-3 py-3 font-medium text-muted-foreground">Qty</th>
                <th className="text-right px-3 py-3 font-medium text-muted-foreground">
                  Unit Price
                </th>
                <th className="text-center px-3 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                  Status
                </th>
                {canEdit && (
                  <th className="px-5 py-3 font-medium text-muted-foreground text-right">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {jobs.map((job) => (
                <tr key={job.id} className={job.isActive ? "" : "opacity-50"}>
                  <td className="px-5 py-3">
                    <p className="font-medium">{job.name}</p>
                    {job.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {job.description}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <Badge variant="outline" className={TYPE_COLORS[job.type] ?? ""}>
                      {TYPE_LABELS[job.type] ?? job.type}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                    {job.quantity.toNumber()}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums font-medium">
                    {formatCurrency(job.unitPrice.toNumber())}
                  </td>
                  <td className="px-3 py-3 text-center hidden sm:table-cell">
                    {job.isActive ? (
                      <span className="text-xs text-green-600 font-medium">Active</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Inactive</span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <form
                          action={async () => {
                            "use server"
                            await toggleCannedJobActive(job.id, !job.isActive)
                          }}
                        >
                          <Button type="submit" variant="ghost" size="sm" className="text-xs">
                            {job.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </form>
                        <Button
                          variant="ghost"
                          size="sm"
                          render={<Link href={`/settings/canned-jobs/${job.id}/edit`} />}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <form
                          action={async () => {
                            "use server"
                            await deleteCannedJob(job.id)
                          }}
                          onSubmit={(e) => {
                            if (!confirm(`Delete "${job.name}"? This cannot be undone.`))
                              e.preventDefault()
                          }}
                        >
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            Delete
                          </Button>
                        </form>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
