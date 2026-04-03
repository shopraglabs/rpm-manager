import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db"
import type { UserRole } from "@/generated/prisma"

export type SessionUser = {
  id: string
  supabaseUid: string
  tenantId: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
}

/**
 * Gets the current authenticated user from the session.
 * Returns null if not authenticated (does NOT redirect).
 */
export async function getSession(): Promise<SessionUser | null> {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return null

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUid: user.id },
    select: {
      id: true,
      supabaseUid: true,
      tenantId: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  })

  if (!dbUser) return null
  return dbUser
}

/**
 * Gets the current authenticated user or redirects to login.
 * Use this in protected Server Components and Server Functions.
 */
export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) redirect("/login")
  return session
}
