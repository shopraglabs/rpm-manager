import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

/**
 * Cron job: runs daily at 9am UTC
 * Finds SENT/VIEWED estimates where expiresAt < today and marks them EXPIRED.
 *
 * Protected by CRON_SECRET to prevent unauthenticated calls.
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  const expired = await prisma.estimate.updateMany({
    where: {
      status: { in: ["SENT", "VIEWED"] },
      expiresAt: { lt: now },
    },
    data: { status: "EXPIRED" },
  })

  console.log(`[expire-estimates] Marked ${expired.count} estimates as EXPIRED`)
  return NextResponse.json({ ok: true, expired: expired.count })
}
