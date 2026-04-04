import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CannedJobForm } from "@/components/canned-jobs/canned-job-form"
import { getCannedJob } from "@/modules/canned-jobs/queries"
import { updateCannedJob } from "@/modules/canned-jobs/actions"

export const metadata: Metadata = { title: "Edit Canned Job" }

export default async function EditCannedJobPage({
  params,
}: {
  params: Promise<{ cannedJobId: string }>
}) {
  const { cannedJobId } = await params
  const job = await getCannedJob(cannedJobId)
  if (!job) notFound()

  const updateWithId = updateCannedJob.bind(null, cannedJobId)

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" render={<Link href="/settings/canned-jobs" />}>
          <ChevronLeft className="h-4 w-4" />
          Canned Jobs
        </Button>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight mb-6">Edit Canned Job</h1>

      <div className="rounded-xl border bg-card p-6">
        <CannedJobForm action={updateWithId} defaultValues={job} submitLabel="Save Changes" />
      </div>
    </div>
  )
}
