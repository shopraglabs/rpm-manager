"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth/session"
import { requirePermission } from "@/lib/auth/permissions"
import { disconnectStripeAccount } from "@/lib/integrations/stripe"

const shopProfileSchema = z.object({
  name: z.string().min(1, "Shop name is required"),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zip: z.string().optional().or(z.literal("")),
  timezone: z.string().optional().or(z.literal("")),
  taxRate: z.coerce.number().min(0).max(100).optional().default(0),
  laborRate: z.coerce.number().min(0).optional().default(0),
})

const userProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional().or(z.literal("")),
})

const inviteUserSchema = z.object({
  email: z.string().email("Invalid email"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["MANAGER", "SERVICE_WRITER", "TECHNICIAN"]),
})

export async function updateShopProfile(formData: FormData) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "settings:update")

  const raw = Object.fromEntries(formData)
  const parsed = shopProfileSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || undefined,
      email: parsed.data.email || undefined,
      address: parsed.data.address || undefined,
      city: parsed.data.city || undefined,
      state: parsed.data.state || undefined,
      zip: parsed.data.zip || undefined,
      timezone: parsed.data.timezone || "America/New_York",
      taxRate: parsed.data.taxRate / 100, // store as decimal (e.g. 0.0825)
      laborRate: parsed.data.laborRate,
    },
  })

  revalidatePath("/settings")
  return { success: true }
}

export async function updateUserProfile(formData: FormData) {
  const { id: userId } = await requireAuth()

  const raw = Object.fromEntries(formData)
  const parsed = userProfileSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone || undefined,
    },
  })

  revalidatePath("/settings")
  return { success: true }
}

export async function inviteUser(formData: FormData) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "users:manage")

  const raw = Object.fromEntries(formData)
  const parsed = inviteUserSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const existing = await prisma.user.findFirst({
    where: { tenantId, email: parsed.data.email },
  })
  if (existing) return { error: "A user with this email already exists" }

  await prisma.user.create({
    data: {
      tenantId,
      supabaseUid: `pending_${crypto.randomUUID()}`,
      email: parsed.data.email,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      role: parsed.data.role as never,
      isActive: false,
    },
  })

  revalidatePath("/settings/users")
  return { success: true, message: `Invitation created for ${parsed.data.email}` }
}

export async function updateUserRole(userId: string, formData: FormData) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "users:manage")

  const newRole = formData.get("role") as string
  if (!["MANAGER", "SERVICE_WRITER", "TECHNICIAN"].includes(newRole)) {
    return { error: "Invalid role" }
  }

  const target = await prisma.user.findFirst({ where: { id: userId, tenantId } })
  if (!target) return { error: "User not found" }
  if (target.role === "OWNER") return { error: "Cannot change the owner's role" }

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole as never },
  })

  revalidatePath("/settings/users")
  return { success: true }
}

export async function deactivateUser(userId: string) {
  const { tenantId, id: currentUserId, role } = await requireAuth()
  requirePermission(role, "users:manage")

  if (userId === currentUserId) return { error: "You cannot deactivate yourself" }

  const target = await prisma.user.findFirst({ where: { id: userId, tenantId } })
  if (!target) return { error: "User not found" }
  if (target.role === "OWNER") return { error: "Cannot deactivate the owner" }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  })

  revalidatePath("/settings/users")
  return { success: true }
}

export async function disconnectStripe() {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "settings:update")

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { stripeAccountId: true },
  })
  if (!tenant?.stripeAccountId) return { error: "No Stripe account connected" }

  try {
    await disconnectStripeAccount(tenant.stripeAccountId)
  } catch (err) {
    console.error("[disconnectStripe] Stripe deauthorize failed:", err)
    // Still clear our side even if Stripe call fails
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { stripeAccountId: null },
  })

  revalidatePath("/settings/billing")
}
