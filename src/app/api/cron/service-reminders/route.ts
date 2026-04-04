import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { emailProvider } from "@/lib/integrations/email"
import { serviceReminderEmail } from "@/lib/integrations/email/templates"
import { formatDate } from "@/lib/utils/format"

export const dynamic = "force-dynamic"

/**
 * Cron job: runs daily at 10am UTC
 * Finds service reminders due within the next 14 days that haven't been notified.
 * Groups by customer+vehicle, sends one email per vehicle with all upcoming services.
 *
 * Protected by CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const cutoff = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days ahead

  // Find reminders due within 14 days that haven't been notified yet
  const reminders = await prisma.serviceReminder.findMany({
    where: {
      isCompleted: false,
      reminderSentAt: null,
      dueDate: { lte: cutoff },
    },
    include: {
      vehicle: {
        select: { id: true, year: true, make: true, model: true },
      },
      customer: {
        select: { id: true, firstName: true, email: true },
      },
      tenant: {
        select: { id: true, name: true, phone: true, email: true, website: true },
      },
    },
    orderBy: { dueDate: "asc" },
  })

  if (reminders.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  // Group by vehicle (one email per vehicle)
  const byVehicle = new Map<
    string,
    {
      vehicle: (typeof reminders)[0]["vehicle"]
      customer: (typeof reminders)[0]["customer"]
      tenant: (typeof reminders)[0]["tenant"]
      reminderIds: string[]
      services: Array<{ service: string; dueDate: string | null; dueMileage: number | null }>
    }
  >()

  for (const r of reminders) {
    if (!byVehicle.has(r.vehicleId)) {
      byVehicle.set(r.vehicleId, {
        vehicle: r.vehicle,
        customer: r.customer,
        tenant: r.tenant,
        reminderIds: [],
        services: [],
      })
    }
    const entry = byVehicle.get(r.vehicleId)!
    entry.reminderIds.push(r.id)
    entry.services.push({
      service: r.service,
      dueDate: r.dueDate ? formatDate(r.dueDate) : null,
      dueMileage: r.dueMileage,
    })
  }

  let sent = 0

  for (const [, entry] of byVehicle) {
    if (!entry.customer.email) continue

    const vehicleLabel = [entry.vehicle.year, entry.vehicle.make, entry.vehicle.model]
      .filter(Boolean)
      .join(" ")

    const { subject, html } = serviceReminderEmail({
      shopName: entry.tenant.name,
      shopPhone: entry.tenant.phone,
      shopEmail: entry.tenant.email,
      customerFirstName: entry.customer.firstName,
      vehicleLabel,
      services: entry.services,
      scheduleUrl: entry.tenant.website ?? null,
    })

    try {
      await emailProvider.send({
        to: entry.customer.email,
        subject,
        html,
        replyTo: entry.tenant.email ?? undefined,
      })

      // Mark all reminders for this vehicle as sent
      await prisma.serviceReminder.updateMany({
        where: { id: { in: entry.reminderIds } },
        data: { reminderSentAt: now },
      })

      sent++
    } catch (err) {
      console.error(`[service-reminders] Failed to email customer ${entry.customer.id}:`, err)
    }
  }

  console.log(
    `[service-reminders] Processed ${reminders.length} reminders across ${byVehicle.size} vehicles, sent ${sent} emails`
  )
  return NextResponse.json({ ok: true, reminders: reminders.length, sent })
}
