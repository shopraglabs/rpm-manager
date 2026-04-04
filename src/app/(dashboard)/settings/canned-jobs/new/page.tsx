import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CannedJobForm } from "@/components/canned-jobs/canned-job-form"
import { createCannedJob } from "@/modules/canned-jobs/actions"

export const metadata: Metadata = { title: "New Canned Job" }

export default function NewCannedJobPage() {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" render={<Link href="/settings/canned-jobs" />}>
          <ChevronLeft className="h-4 w-4" />
          Canned Jobs
        </Button>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight mb-6">New Canned Job</h1>

      <div className="rounded-xl border bg-card p-6">
        <CannedJobForm action={createCannedJob} submitLabel="Create Canned Job" />
      </div>
    </div>
  )
}
