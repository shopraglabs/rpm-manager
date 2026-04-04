import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { emailProvider } from "@/lib/integrations/email"
import { appointmentReminderEmail } from "@/lib/integrations/email/templates"
import { smsProvider } from "@/lib/integrations/sms"
import { appointmentReminderSms } from "@/lib/integrations/sms/templates"

export const dynamic = "force-dynamic"

/**
 * Cron job: runs daily at 8am UTC
 * Finds tomorrow's appointments where reminderSent = false
 * Sends SMS (if phone available) and email (if email available)
 * Marks reminderSent = true to prevent duplicates
 *
 * Protected by CRON_SECRET to prevent unauthenticated calls.
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  // tomorrow window
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0)
  const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59)

  const appointments = await prisma.appointment.findMany({
    where: {
      startTime: { gte: tomorrowStart, lte: tomorrowEnd },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      reminderSent: false,
      OR: [{ customerEmail: { not: null } }, { customerPhone: { not: null } }],
    },
    include: {
      vehicle: { select: { year: true, make: true, model: true } },
      tenant: {
        select: {
          name: true,
          phone: true,
          email: true,
          address: true,
          city: true,
          state: true,
        },
      },
    },
  })

  let smsSent = 0
  let emailSent = 0

  for (const apt of appointments) {
    const appointmentDate = apt.startTime.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    const appointmentTime = apt.startTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
    const vehicleLabel = apt.vehicle
      ? [apt.vehicle.year, apt.vehicle.make, apt.vehicle.model].filter(Boolean).join(" ")
      : null
    const shopAddress = [apt.tenant.address, apt.tenant.city, apt.tenant.state]
      .filter(Boolean)
      .join(", ")

    // SMS reminder
    if (apt.customerPhone) {
      try {
        const message = appointmentReminderSms({
          shopName: apt.tenant.name,
          shopPhone: apt.tenant.phone,
          customerName: apt.customerName,
          serviceTitle: apt.title,
          date: appointmentDate,
          time: appointmentTime,
        })
        await smsProvider.send({ to: apt.customerPhone, body: message })
        smsSent++
      } catch (err) {
        console.error(`[appointment-reminders] SMS failed for apt ${apt.id}:`, err)
      }
    }

    // Email reminder
    if (apt.customerEmail) {
      try {
        const customerFirstName = apt.customerName.split(" ")[0] ?? apt.customerName
        const { subject, html } = appointmentReminderEmail({
          shopName: apt.tenant.name,
          shopPhone: apt.tenant.phone,
          shopEmail: apt.tenant.email,
          shopAddress: shopAddress || null,
          customerFirstName,
          appointmentTitle: apt.title,
          appointmentDate,
          appointmentTime,
          vehicleLabel,
          description: apt.description,
        })
        await emailProvider.send({
          to: apt.customerEmail,
          subject,
          html,
          replyTo: apt.tenant.email ?? undefined,
        })
        emailSent++
      } catch (err) {
        console.error(`[appointment-reminders] Email failed for apt ${apt.id}:`, err)
      }
    }

    // Mark reminder sent
    await prisma.appointment.update({
      where: { id: apt.id },
      data: { reminderSent: true },
    })
  }

  console.log(
    `[appointment-reminders] Processed ${appointments.length} appointments: ${smsSent} SMS, ${emailSent} emails`
  )
  return NextResponse.json({ ok: true, appointments: appointments.length, smsSent, emailSent })
}
