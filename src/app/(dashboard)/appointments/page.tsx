import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Appointments",
}

export default function AppointmentsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Appointments</h1>
      <p className="text-muted-foreground">Coming soon…</p>
    </div>
  )
}
